import * as T from './assets/three.module.js';
import { GLTFLoader } from './assets/GLTFLoader.js';

// Image-generated meshes often share one texture across paint, glass and trim.
// Keep those original details and limit paint tinting to neutral body surfaces.
export async function loadGeneratedVehicle(scene, concept, renderer, onChange) {
 const gltf = await new GLTFLoader().loadAsync('./assets/om-generated.glb');
 const model = gltf.scene;
 const bounds = new T.Box3().setFromObject(model);
 const size = bounds.getSize(new T.Vector3());
 if (!Number.isFinite(size.length()) || size.length() === 0) throw new Error('Empty vehicle model');
 const scale = 4.85 / Math.max(size.x, size.y, size.z);
 const center = bounds.getCenter(new T.Vector3());
 model.position.sub(center);
 const vehicle = new T.Group();
 vehicle.add(model); vehicle.scale.setScalar(scale);
 // TRELLIS exports Y-up. Face the long axis along the existing showroom stage.
 if (size.z > size.x) vehicle.rotation.y = -Math.PI / 2;
 scene.add(vehicle); vehicle.updateMatrixWorld(true);
 const placed = new T.Box3().setFromObject(vehicle);
 vehicle.position.y = .11 - placed.min.y;
 vehicle.updateMatrixWorld(true);
 const worldBounds = new T.Box3().setFromObject(vehicle);
 const height = worldBounds.max.y - worldBounds.min.y;
 const uniforms = { omPaint: { value: new T.Color('#45494a') }, omTint: { value: 0 } };
 let triangles = 0, meshes = 0;
 vehicle.traverse(node => {
  if (!node.isMesh) return;
  meshes++; triangles += (node.geometry.index?.count || node.geometry.attributes.position.count) / 3;
  node.castShadow = true; node.receiveShadow = true;
  const positions = node.geometry.attributes.position;
  const normals = node.geometry.attributes.normal;
  const mask = new Float32Array(positions.count);
  const point = new T.Vector3(), normal = new T.Vector3();
  const normalMatrix = new T.Matrix3().getNormalMatrix(node.matrixWorld);
  for (let i = 0; i < positions.count; i++) {
   point.fromBufferAttribute(positions, i).applyMatrix4(node.matrixWorld);
   const y = (point.y - worldBounds.min.y) / height;
   normal.fromBufferAttribute(normals, i).applyMatrix3(normalMatrix).normalize();
   // Avoid tire sidewalls and cabin glass; allow the hood, doors and roof.
   mask[i] = y > .28 && (y < .66 || normal.y > .70) ? 1 : 0;
  }
  node.geometry.setAttribute('omBodyMask', new T.BufferAttribute(mask, 1));
  const materials = Array.isArray(node.material) ? node.material : [node.material];
  const replacements = materials.map(original => {
   const material = original.clone();
   material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = 'attribute float omBodyMask; varying float vOmBodyMask;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvOmBodyMask = omBodyMask;');
    shader.fragmentShader = 'uniform vec3 omPaint; uniform float omTint; varying float vOmBodyMask;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      float omHi = max(diffuseColor.r, max(diffuseColor.g, diffuseColor.b));
      float omLo = min(diffuseColor.r, min(diffuseColor.g, diffuseColor.b));
      float omLum = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
      float omNeutral = 1.0 - smoothstep(0.18, 0.30, (omHi - omLo) / max(omHi, 0.001));
      float omPaintMask = vOmBodyMask * omNeutral * smoothstep(0.012, 0.035, omLum) * (1.0 - smoothstep(0.45, 0.70, omLum));
      vec3 omRecolored = omPaint * clamp(omLum / 0.065, 0.25, 2.5);
      diffuseColor.rgb = mix(diffuseColor.rgb, omRecolored, omPaintMask * omTint);
    `);
   };
   material.customProgramCacheKey = () => 'om-body-paint-v1';
   return material;
  });
  node.material = Array.isArray(node.material) ? replacements : replacements[0];
 });
 concept.visible = false;
 renderer.shadowMap.needsUpdate = true;
 onChange();
 return {
  setPaint(color) { uniforms.omPaint.value.set(color); uniforms.omTint.value = color.toLowerCase() === '#45494a' ? 0 : 1; onChange(); },
  getState() { return { source: 'TRELLIS.2 image-to-3D', triangles, meshes, bounds: worldBounds.getSize(new T.Vector3()).toArray() }; }
 };
}
