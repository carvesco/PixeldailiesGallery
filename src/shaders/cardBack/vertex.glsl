varying vec2 vUv;
uniform sampler2D uTexture;

void main() {
    vUv = uv;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

}