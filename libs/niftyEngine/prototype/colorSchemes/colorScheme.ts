import { Color } from "../../math/color";

export class ColorScheme {
    // https://www.schemecolor.com/can-you-swim.php
    // Background/focus
    static background = Color.createFromHex("#2d3436")
    static default = Color.createFromHex("#A19A97")
    static focus = Color.createFromHex("#06CBD7")

    // Text
    static dark = Color.createFromHex("#3E3D46")
    static light = Color.createFromHex("#DDD4D1")

    // Default colors (use above instead when possible)
    static red = Color.createFromHex("#d63031")
    static orange = Color.createFromHex("#e67e22")
    static yellow = Color.createFromHex("#fdcb6e")
    static green = Color.createFromHex("#00b894")
    static blue = Color.createFromHex("#0984e3")
    static purple = Color.createFromHex("#8e44ad")

    // Hardcoded (WHITE must be solid white, black must be solid black)
    static white = Color.createFromHex("#FFFFFF")
    static gray = Color.createFromHex("#bdc3c7")
    static black = Color.createFromHex("#000000")
}