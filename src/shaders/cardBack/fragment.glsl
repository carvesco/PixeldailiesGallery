varying vec2 vUv;
uniform sampler2D uTexture;
uniform float uTime;
uniform vec2 uResolution;

#define bgColor vec3(0.39215, 0.1176, 0.2039) // #5a8c84
#define fgColor vec3(0.3412, 0.0784, 0.1608)  // #5a8c84

vec2 random2(vec2 st) {
    st = vec2(dot(st, vec2(127.1, 311.7)), dot(st, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(st) * 43758.5453123);
}

float noisegradient(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(mix(dot(random2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)), dot(random2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x), mix(dot(random2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), dot(random2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
}

void main() {
    vec2 st = vUv * 1.0;
    float t = 1.0;
    t = 2.5;
    st += noisegradient(st * 2.0) * t;
    st += uTime * 0.05;
    vec2 pos = vec2(st * 10.0);
    // Use the noise function
    float n = noisegradient(pos);

    gl_FragColor = vec4(vec3(n), 1.0);

    //Distance field
    gl_FragColor = vec4(vec3(fract(n * 10.0)), 1.0);

    vec3 color = vec3(0.0);

    color = vec3(mix(bgColor, fgColor, smoothstep(0.03, 0.04, n)));
    vec4 textureColor = texture2D(uTexture, vUv);
    textureColor.a = color.x; // Ensure the texture is fully opaque
    gl_FragColor = textureColor;
}