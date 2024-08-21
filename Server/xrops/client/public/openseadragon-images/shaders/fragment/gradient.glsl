precision mediump float;
uniform sampler2D u_tile;
uniform vec2 u_tile_size;
varying vec2 v_tile_pos;

// Sum a vector
float sum3(vec3 v) {
  return dot(v,vec3(1));
}

// Weight of a matrix
float weigh3(mat3 m) {
  return sum3(m[0])+sum3(m[1])+sum3(m[2]);
}

// Take the outer product
mat3 outer3(vec3 c, vec3 r) {
  mat3 goal;
  for (int i =0; i<3; i++) {
      goal[i] = r*c[i];
  }
  return goal;
}

// Sample the color at offset
vec3 color(float dx, float dy) {
  // calculate the color of sampler at an offset from position
  return texture2D(u_tile, v_tile_pos+vec2(dx,dy)).rgb;
}


void main() {
  // Prep work
  vec3 near_in[9];
  vec2 u = vec2(1./u_tile_size.x, 1./u_tile_size.y);
  // Calculate coordinates of nearest points
  for (int i = 0; i < 9; i++) {
    near_in[i] = color(mod(float(i),3.)*u.x, float(i/3-1)*u.y);
  }
  gl_FragColor = vec4(abs(length(near_in[3]-near_in[5])),abs(length(near_in[1]-near_in[7])),0,1);
}