// EXTENSIONS
    #ifdef MULTIVIEW_COUNT
      #extension GL_OVR_multiview2 : require
      layout (num_views = MULTIVIEW_COUNT) in;
    #endif

    // PRECISION
    precision mediump float;

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
      mediump vec3 u_lightWorldPos;
      mediump vec3 u_lightWorldDirection;
      mediump vec4 u_lightColor;
      float u_brightness;
    } lights[LIGHT_COUNT];

    uniform Material {
      vec4 u_albedoColor;
      mat4 u_albedoMatrix;
      float u_metallic;
      float u_roughness;
      float u_ambientLight;
    } prop;

    uniform Model {
      mat4 u_world;
    } foo;

    // ATTRIBUTES
    #if COLOR_ATTRIBUTE
      in vec3 a_color;
      out vec3 v_color;
    #endif
    
    in vec3 a_position;
    in vec3 a_normal;
    in vec2 a_texcoord;

    // VARYING 
    out vec3 v_worldPosition;
    out vec2 v_texCoord;
    out vec3 v_normal;
    

    
    // FUNCTIONS

    // MAIN
    void main() {
      #ifdef MULTIVIEW_COUNT
        mat4 u_view = gl_ViewID_OVR == 0u ? (views[0].u_view) :  (views[1].u_view);
        mat4 u_projection = gl_ViewID_OVR == 0u ? views[0].u_projection :  views[1].u_projection;
      #else
        mat4 u_view = views[0].u_view;
        mat4 u_projection = views[0].u_projection;
      #endif

      v_texCoord = (prop.u_albedoMatrix * vec4(a_texcoord, 0,0)).xy;
      v_worldPosition = vec3(foo.u_world * vec4(a_position, 1));

      // casting world to mat3 multiply seems to be bugged on quest so using mat4 multiply then cast to vec3
      mat4 rot = foo.u_world;
      rot[0][3] = 0.0;
      rot[1][3] = 0.0;
      rot[2][3] = 0.0;
      rot[3][0] = 0.0;
      rot[3][1] = 0.0;
      rot[3][2] = 0.0;
      rot[3][3] = 0.0;     
      v_normal = normalize(vec3(rot * vec4(a_normal, 1)));

      #if COLOR_ATTRIBUTE
        v_color = a_color;
      #endif
      gl_Position = u_projection * u_view * vec4(v_worldPosition, 1);
    }