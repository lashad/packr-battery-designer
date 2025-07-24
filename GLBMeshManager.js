// GLBMeshManager.js
class GLBMeshManager {
  constructor(scene, assetsPath = "assets/") {
    this.scene = scene;
    this.assetsPath = assetsPath;
    this.mm = 0.001; // millimeters to meters
  }

  async loadGLB(filename, name = "") {
    return new Promise((resolve, reject) => {
      BABYLON.SceneLoader.ImportMesh(
        "",
        this.assetsPath,
        filename,
        this.scene,
        (meshes) => {
          const root = meshes[0];
          if (name) root.name = name;
          this.setPosition(root, 0, 0, 0);
          this.setRotation(root, 0, 0, 0);
          resolve(root);
        },
        null,
        (scene, message, exception) => reject(exception)
      );
    });
  }

  setPosition(mesh, x, y, z) {
    mesh.position = new BABYLON.Vector3(x * this.mm, y * this.mm, z * this.mm);
  }

  setRotation(mesh, xDeg, yDeg, zDeg) {
    mesh.rotation = new BABYLON.Vector3(
      BABYLON.Angle.FromDegrees(xDeg).radians(),
      BABYLON.Angle.FromDegrees(yDeg).radians(),
      BABYLON.Angle.FromDegrees(zDeg).radians()
    );
  }

  applyColor(mesh, color3, alpha = 1) {
    const mat = new BABYLON.StandardMaterial(`${mesh.name}_mat`, this.scene);
    mat.diffuseColor = color3;
    mat.alpha = alpha;
    mesh.getChildMeshes().forEach((m) => (m.material = mat));
  }

  cloneMesh(mesh, name) {
    return mesh.clone(name);
  }

  cloneAndTransform({
    name,
    source,
    x = 0,
    y = 0,
    z = 0,
    rx = 0,
    ry = 0,
    rz = 0,
  }) {
    const clone = this.cloneMesh(source, name);
    this.setPosition(clone, x, y, z);
    this.setRotation(clone, rx, ry, rz);
    return clone;
  }

  transform(node, {
    x = 0,
    y = 0,
    z = 0,
    rx = 0,
    ry = 0,
    rz = 0,
  }) {
    this.setPosition(node, x, y, z);
    this.setRotation(node, rx, ry, rz);
  }

  alpha(source, value) {
    source.getChildMeshes().forEach((mesh) => {
      mesh.setEnabled(true);

      // Clone or create a new material if needed
      let mat = mesh.material;
      if (!mat) {
        mat = new BABYLON.StandardMaterial("transparentMat", this.scene);
        mesh.material = mat;
      } else {
        mat = mat.clone(`${mesh.name}_transparentMat`);
        mesh.material = mat;
      }

      // Enable transparency
      mat.alpha = value;
      mat.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
    });
  }

  setMetadataRecursive(node, metadata) {
  node.getChildMeshes().forEach(child => {
    child.metadata = { ...metadata };
  });
};

//   setMetadataRecursive(node, metadata) {
//   if (node instanceof BABYLON.Mesh) {
//     node.metadata = metadata;
//   }
//   node.getChildMeshes().forEach(child => {
//     child.metadata = metadata;
//   });
// };

  /* lol */
  async create2pac(name) {
    const assembly = new BABYLON.TransformNode(name, this.scene);

    /* Create two 18650 battery cell mesh */
    const battery1 = await this.loadGLB("18650.glb", `${name}_1`);
    const battery2 = this.cloneMesh(battery1, `${name}_2`);
    this.setMetadataRecursive(battery1, { type: "18650"});
    this.setMetadataRecursive(battery2, { type: "18650"});
    
    this.setRotation(battery1, 180, 0, 90);
    this.setRotation(battery2, 180, 0, 90);
    this.setPosition(battery2, 0, -20.25, 0);
    battery1.parent = assembly;
    battery2.parent = assembly;

    /* Create two holders */
    const holder = await this.loadGLB("holder.glb", `${name}_holder_1`);
    
    this.setRotation(holder, 0, 270, 90);
    this.setPosition(holder, 0, 0, -32.5);
    this.applyColor(holder, new BABYLON.Color3(0.1, 0.12, 0.15), 1);
    holder.parent = assembly;
    let tmp = this.cloneAndTransform({ name: `${name}_holder_2`, source: holder, x: 0, y: 0, z: 32.5, rx: 0, ry: 90, rz: 90 });
    tmp.parent = assembly;
    this.setRotation(assembly, 0, 0, 90);
    const bridgeAlpha = 0.0;
    const bridge = await this.loadGLB("bridge.glb", `${name}_bridge_1`);
    this.setRotation(bridge, -90, 0, 0);
    this.setPosition(bridge, 10.125, -20.25, -32.5);
    this.applyColor(bridge, new BABYLON.Color3(0.2, 0.8, 1), 1);
    this.setMetadataRecursive(bridge, { type: "bridge", alpha: true});
    this.alpha(bridge,bridgeAlpha);
    bridge.parent = assembly;
    
    tmp = this.cloneAndTransform({ name: `${name}_bridge_2`, source: bridge, x: 0, y: -10.125, z: -32.5, rx: 0, ry: 90, rz: -90 });
    this.setMetadataRecursive(tmp, { type: "bridge", alpha: true});
    this.alpha(tmp,bridgeAlpha);
    tmp.parent = assembly;
    tmp = this.cloneAndTransform({ name: `${name}_bridge_3`, source: bridge, x: 0, y: -30.375, z: -32.5, rx: 0, ry: 90, rz: -90 });
    this.setMetadataRecursive(tmp, { type: "bridge", alpha: true});
    tmp.parent = assembly;
    this.alpha(tmp,bridgeAlpha);
    tmp = this.cloneAndTransform({ name: `${name}_bridge_4`, source: bridge, x: -10.125, y: -20.25, z: -32.5, rx: 90, ry: 90, rz: -90 });
    this.setMetadataRecursive(tmp, { type: "bridge", alpha: true});
    tmp.parent = assembly;
    this.alpha(tmp,bridgeAlpha);
    tmp = this.cloneAndTransform({ name: `${name}_bridge_5`, source: bridge, x: 0, y: 20.25 - 10.125, z: -32.5, rx: 0, ry: 90, rz: -90 });
    this.setMetadataRecursive(tmp, { type: "bridge", alpha: true});
    tmp.parent = assembly;
    this.alpha(tmp,bridgeAlpha);
    tmp = this.cloneAndTransform({ name: `${name}_bridge_6`, source: bridge, x: 10.125, y: 0, z: -32.5, rx: 90, ry: 90, rz: -90 });
    this.setMetadataRecursive(tmp, { type: "bridge", alpha: true});
    tmp.parent = assembly;
    this.alpha(tmp,bridgeAlpha);
    tmp = this.cloneAndTransform({ name: `${name}_bridge_7`, source: bridge, x: -10.125, y: 0, z: -32.5, rx: 90, ry: 90, rz: -90 });
    this.setMetadataRecursive(tmp, { type: "bridge", alpha: true});
    tmp.parent = assembly;
    this.alpha(tmp,bridgeAlpha);
    tmp = this.cloneAndTransform({ name: `${name}_bridge_8`, source: bridge, x: 0, y: -10.125, z: 32.5, rx: 0, ry: 90, rz: 90 });
    this.setMetadataRecursive(tmp, { type: "bridge", alpha: true});
    tmp.parent = assembly;
    this.alpha(tmp,bridgeAlpha);
    tmp = this.cloneAndTransform({ name: `${name}_bridge_9`, source: bridge, x: 0, y: -30.375, z: 32.5, rx: 0, ry: 90, rz: 90 });
    this.setMetadataRecursive(tmp, { type: "bridge", alpha: true});
    tmp.parent = assembly;
    this.alpha(tmp,bridgeAlpha);
    tmp = this.cloneAndTransform({ name: `${name}_bridge_10`, source: bridge, x: -10.125, y: -20.25, z: 32.5, rx: 90, ry: 90, rz: 90 });
    this.setMetadataRecursive(tmp, { type: "bridge", alpha: true});
    tmp.parent = assembly;
    this.alpha(tmp,bridgeAlpha);
    tmp = this.cloneAndTransform({ name: `${name}_bridge_11`, source: bridge, x: 10.125, y: -20.25, z: 32.5, rx: 90, ry: 90, rz: 90 });
    this.setMetadataRecursive(tmp, { type: "bridge", alpha: true});
    tmp.parent = assembly;
    this.alpha(tmp,bridgeAlpha);
    tmp = this.cloneAndTransform({ name: `${name}_bridge_12`, source: bridge, x: 0, y: 20.25 - 10.125, z: 32.5, rx: 0, ry: 90, rz: 90 });
    this.setMetadataRecursive(tmp, { type: "bridge", alpha: true});
    tmp.parent = assembly;
    this.alpha(tmp,bridgeAlpha);
    tmp = this.cloneAndTransform({ name: `${name}_bridge_13`, source: bridge, x: 10.125, y: 0, z: 32.5, rx: 90, ry: 90, rz: 90 });
    this.setMetadataRecursive(tmp, { type: "bridge", alpha: true});
    tmp.parent = assembly;
    this.alpha(tmp,bridgeAlpha);
    tmp = this.cloneAndTransform({ name: `${name}_bridge_14`, source: bridge, x: -10.125, y: 0, z: 32.5, rx: 90, ry: 90, rz: 90 });
    tmp.parent = assembly;

    return assembly;
  }

  async createPack(rows, cols, namePrefix = "battery_pack") {
  const xSpacing = 40.50;
  const ySpacing = 20.25;
  let count = 1;

  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      const name = `${namePrefix}_${count}`;
      const assembly = await this.create2pac(name);

      this.transform(assembly, {
        x: xSpacing * col,
        y: ySpacing * row,
        z: 0,
        rx: 0,
        ry: 0,
        rz: 90
      });

      count++;
    }
  }
}

  async create3S8P() {
      const battery_pack1_assembly = await this.create2pac("battery_pack_1");
      const battery_pack2_assembly = await this.create2pac("battery_pack_2");
      this.transform(battery_pack2_assembly, {x: 0, y: 20.25 * 1, z: 0, rx: 0, ry: 0, rz: 90});
      const battery_pack3_assembly = await this.create2pac("battery_pack_3");
      this.transform(battery_pack3_assembly, {x: 0, y: 20.25 * 2, z: 0, rx: 0, ry: 0, rz: 90 });
      const battery_pack4_assembly = await this.create2pac("battery_pack_4");
      this.transform(battery_pack4_assembly, {x: 40.50, y: 0, z: 0, rx: 0, ry: 0, rz: 90});
      const battery_pack5_assembly = await this.create2pac("battery_pack_5");
      this.transform(battery_pack5_assembly, {x: 40.50, y: 20.25 * 1, z: 0, rx: 0, ry: 0, rz: 90});
      const battery_pack6_assembly = await this.create2pac("battery_pack_6");
      this.transform(battery_pack6_assembly, {x: 40.50, y: 20.25 * 2, z: 0, rx: 0, ry: 0, rz: 90});
      const battery_pack7_assembly = await this.create2pac("battery_pack_7");
      this.transform(battery_pack7_assembly, {x: 40.50 * 2, y: 0, z: 0, rx: 0, ry: 0, rz: 90});
      const battery_pack8_assembly = await this.create2pac("battery_pack_8");
      this.transform(battery_pack8_assembly, {x: 40.50 * 2, y: 20.25 * 1, z: 0, rx: 0, ry: 0, rz: 90});
      const battery_pack9_assembly = await this.create2pac("battery_pack_9");
      this.transform(battery_pack9_assembly, {x: 40.50 * 2, y: 20.25 * 2, z: 0, rx: 0, ry: 0, rz: 90});
      const battery_pack10_assembly = await this.create2pac("battery_pack_10");
      this.transform(battery_pack10_assembly, {x: 40.50 * 3, y: 0, z: 0, rx: 0, ry: 0, rz: 90});
      const battery_pack11_assembly = await this.create2pac("battery_pack_11");
      this.transform(battery_pack11_assembly, {x: 40.50 * 3, y: 20.25 * 1, z: 0, rx: 0, ry: 0, rz: 90});
      const battery_pack12_assembly = await this.create2pac("battery_pack_12");
      this.transform(battery_pack12_assembly, {x: 40.50 * 3, y: 20.25 * 2, z: 0, rx: 0, ry: 0, rz: 90});
  }

  saveScene(fileName, scene) {
    // this.sanitizeScene();
    const serialized = BABYLON.SceneSerializer.Serialize(scene);

    try {
      const data = JSON.stringify(serialized);
      const blob = new Blob([data], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to save scene:", err);
    }
  }
}
