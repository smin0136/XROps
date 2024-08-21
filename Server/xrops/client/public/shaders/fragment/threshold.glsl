precision mediump float;
uniform sampler2D u_tile;
uniform vec2 u_tile_size;
varying vec2 v_tile_pos;
uniform vec3 pointed_color;

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
  vec3 value = texture2D(u_tile, v_tile_pos).rgb;
  float signal = distance(value,pointed_color);
//  float signal = length(value);
  if(signal<0.1){
    gl_FragColor = vec4(0,0,1.0,0.3); 
  }
  else{
    gl_FragColor = vec4(value,1.0); 
  }
}