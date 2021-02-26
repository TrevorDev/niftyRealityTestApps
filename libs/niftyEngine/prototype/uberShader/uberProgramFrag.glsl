 #ifdef MULTIVIEW_COUNT
    #extension GL_OVR_multiview2 : require
#endif
// PRECISION  
precision mediump float;

// CONST
const float PI = 3.14159265359;

// VARYING 
in vec3 v_worldPosition;
in vec2 v_texCoord;
in vec3 v_normal;
#if COLOR_ATTRIBUTE
in vec3 v_color;
#endif

// UNIFORMS
#ifdef MULTIVIEW_COUNT
    uniform Views {
    mat4 u_view;
    mat4 u_projection;
    vec3 u_camPos;
    } views[MULTIVIEW_COUNT];
#else
    uniform Views {
    mat4 u_view;
    mat4 u_projection;
    vec3 u_camPos;
    } views[1];
#endif

uniform Lights {
    vec3 u_lightWorldPos;
    vec3 u_lightWorldDirection;
    vec4 u_lightColor;
    float u_brightness;
} lights[LIGHT_COUNT];

uniform sampler2D u_albedoTexture;
uniform sampler2D u_metallicTexture;
uniform sampler2D u_roughnessTexture;

uniform Material {
    vec4 u_albedoColor;
    mat4 u_albedoMatrix;
    float u_metallic;
    float u_roughness;
    float u_ambientLight;
} prop;

// Result
out vec4 result;

// FUNCTIONS

// ----------------------------------------------------------------------------
float DistributionGGX(vec3 N, vec3 H, float roughness)
{
    float a = roughness*roughness;
    float a2 = a*a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH*NdotH;

    float nom   = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;

    return nom / denom;
}
// ----------------------------------------------------------------------------
float GeometrySchlickGGX(float NdotV, float roughness)
{
    float r = (roughness + 1.0);
    float k = (r*r) / 8.0;

    float nom   = NdotV;
    float denom = NdotV * (1.0 - k) + k;

    return nom / denom;
}
// ----------------------------------------------------------------------------
float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness)
{
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2 = GeometrySchlickGGX(NdotV, roughness);
    float ggx1 = GeometrySchlickGGX(NdotL, roughness);

    return ggx1 * ggx2;
}
// ----------------------------------------------------------------------------
vec3 fresnelSchlick(float cosTheta, vec3 F0)
{
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

void main() {
    #ifdef ALBEDO_ONLY
        result = vec4(texture(u_albedoTexture, v_texCoord).rgb + prop.u_albedoColor.rgb, 1.0);

        // #ifdef ALBEDO_ONLY_DIR_LIGHT
        // TODO do normal calc in vert shader
        vec3 triWorldNormal = normalize(v_normal);
        float lightVal = max(dot(lights[0].u_lightWorldDirection, triWorldNormal), 0.0)/5.0;
        result += lightVal;
        float lightVal2 = max(dot(vec3(0.1,-0.3,1), triWorldNormal), 0.0)/10.0;
        result += lightVal2;
        // #endif

        return;
    #endif
    // Get normal for this pixel
    // TODO support normal map
    vec3 worldNormal = normalize(v_normal);

    // Get vector towards the camera
    #ifdef MULTIVIEW_COUNT
     vec3 camPos = gl_ViewID_OVR == 0u ? (views[0].u_camPos) :  (views[1].u_camPos);
    #else
      vec3 camPos = views[0].u_camPos;
    #endif
    vec3 towardsCamera = normalize(camPos - v_worldPosition);

    // Load color and metallic/rouphness values
    vec4 tx = texture(u_albedoTexture, v_texCoord);
    if(tx.a < 0.15){
        discard;
    }
    vec3 albedo     = tx.rgb;
    albedo += prop.u_albedoColor.rgb;
    float metallic  = texture(u_metallicTexture, v_texCoord).r;
    metallic += prop.u_metallic;
    float roughness = texture(u_metallicTexture, v_texCoord).g;
    roughness += prop.u_roughness;

    // metallic = 0.8;
    // roughness = 0.1;

    // TODO get from ao texture
    float ambientOcclusion = 1.0; 

    // TODO make parameter
    float ambientLight = 0.1;

    // How much the surface reflects if looking directly at the surface
    vec3 surfaceReflectionAtZero = vec3(0.04); 
    surfaceReflectionAtZero = mix(surfaceReflectionAtZero, albedo, metallic);

    // Direct lighting will be computed as we itterate over lights
    vec3 directLightingColor = vec3(0.0);

    // Lights
    for(int i = 0; i < 1; ++i) 
    {
        vec3 towardsLight = normalize(lights[0].u_lightWorldPos - v_worldPosition);
        vec3 H = normalize(towardsCamera + towardsLight);
        float distance = length(lights[0].u_lightWorldPos - v_worldPosition);
        float attenuation = lights[0].u_brightness / (distance * distance);
        vec3 radiance = lights[0].u_lightColor.rgb * attenuation;

        // Cook-Torrance BRDF
        float NDF = DistributionGGX(worldNormal, H, roughness);   
        float G   = GeometrySmith(worldNormal, towardsCamera, towardsLight, roughness);      
        vec3 F    = fresnelSchlick(max(dot(H, towardsCamera), 0.0), surfaceReflectionAtZero);
        
        vec3 nominator    = NDF * G * F; 
        float denominator = 4. * max(dot(worldNormal, towardsCamera), 0.0) * max(dot(worldNormal, towardsLight), 0.0) + 0.001; // 0.001 to prevent divide by zero.
        vec3 specular = nominator / denominator;
        
        // kS is equal to Fresnel
        vec3 kS = F;
        // for energy conservation, the diffuse and specular light can't
        // be above 1.0 (unless the surface emits light); to preserve this
        // relationship the diffuse component (kD) should equal 1.0 - kS.
        vec3 kD = vec3(1.0) - kS;
        // multiply kD by the inverse metalness such that only non-metals 
        // have diffuse lighting, or a linear blend if partly metal (pure metals
        // have no diffuse light).
        kD *= 1.0 - metallic;	  

        // scale light by NdotL
        float NdotL = max(dot(worldNormal, towardsLight), 0.0);        

        // add to outgoing radiance Lo
        directLightingColor += (kD * albedo / PI + specular) * radiance * NdotL;  // note that we already multiplied the BRDF by the Fresnel (kS) so we won't multiply by kS again
    }   

    // Apply resulting lighting to albedo color
    vec3 color = (vec3(ambientLight) * albedo * ambientOcclusion) + directLightingColor;
	
    // Gamma correction
    color = color / (color + vec3(1.0));
    color = pow(color, vec3(1.0/2.2));  
   
    result = vec4(color, 1.0);
}