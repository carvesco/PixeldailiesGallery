varying vec3 vPos;
uniform samplerCube cube;
void main() {
    gl_FragColor = textureCube(cube, normalize(vPos));
}