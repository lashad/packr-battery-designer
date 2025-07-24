const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true, {
  preserveDrawingBuffer: true,
  stencil: true,
  alpha: false,
});
let currentScene = null;

const createScene = async () => {
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.18, 0.24, 0.35, 1);
  const camera = new BABYLON.ArcRotateCamera(
    "camera",
    Math.PI / 2,
    Math.PI / 3,
    5,
    BABYLON.Vector3.Zero(),
    scene
  );
  camera.attachControl(canvas, true);
  const manager = new GLBMeshManager(scene);
  scene.manager = manager;

  return scene;
};

function getRootMesh(mesh) {
  let firstChild = mesh;
  while (mesh.parent) {
    firstChild = mesh;
    mesh = mesh.parent;
  }
  return firstChild;
}

function attachEvents(scene) {
  let lastHoveredMesh = null;
  scene.onPointerObservable.add((pointerInfo) => {
    if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE) {
      const pick = scene.pick(scene.pointerX, scene.pointerY);
      if (
        lastHoveredMesh &&
        (!pick.hit || pick.pickedMesh !== lastHoveredMesh)
      ) {
        lastHoveredMesh.renderOutline = false;
        lastHoveredMesh = null;
      }
      if (pick.hit && pick.pickedMesh !== lastHoveredMesh) {
        lastHoveredMesh = pick.pickedMesh;
        lastHoveredMesh.outlineColor = new BABYLON.Color3(1, 0, 0);
        lastHoveredMesh.outlineWidth = 0.05;
        lastHoveredMesh.renderOutline = true;
      }
    }

    if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERPICK) {
      const pick = pointerInfo.pickInfo;
      if (pick.hit && pick.pickedMesh) {
        const pickedMesh = pick.pickedMesh;
        const rootMesh = getRootMesh(pickedMesh);
        const meta = pick.pickedMesh.metadata;

        if (meta && meta.type === "18650") {
          if (!rootMesh.metadata) rootMesh.metadata = {};
          rootMesh.metadata.flipped = !rootMesh.metadata.flipped;

          if (rootMesh.metadata.flipped) {
            scene.manager.setRotation(rootMesh, 0, 0, 90);
          } else {
            scene.manager.setRotation(rootMesh, 180, 0, 90);
          }
        }
        if (meta && meta.type === "bridge") {
          if (!rootMesh.metadata) rootMesh.metadata = {};
          if (!rootMesh.metadata.alpha) {
            scene.manager.alpha(rootMesh, 1);
          } else {
            scene.manager.alpha(rootMesh, 0.0);
          }
          rootMesh.metadata.alpha = !rootMesh.metadata.alpha;
        } else {
          console.log("No metadata.type found on this mesh");
        }
      }
    }
  });
}

window.addEventListener("resize", () => engine.resize());

document.getElementById("saveSceneBtn").onclick = () =>
  currentScene.manager.saveScene("scene.babylon", currentScene);

document.getElementById("createCustomPack").onclick = async () => {
  const rows = parseInt(document.getElementById("inputRows").value, 10);
  const cols = parseInt(document.getElementById("inputCols").value, 10);
  const name = document.getElementById("inputName").value.trim();

  if (isNaN(rows) || isNaN(cols) || !name) {
    alert("Please fill in valid row, column, and name values.");
    return;
  }

  currentScene = null;

  createScene().then((scene) => {
    currentScene = scene;
    engine.runRenderLoop(() => scene.render());

    attachEvents(currentScene);

    currentScene.manager.createPack(rows, cols, name).then(() => {
      currentScene.createDefaultCameraOrLight(true, true, true);
    });
  });
};

document.getElementById("hideAlpha").onclick = () =>
  showHideAlpha(currentScene, false);
document.getElementById("showAlpha").onclick = () =>
  showHideAlpha(currentScene, true);

// document.getElementById("frontView").onclick = () => cameraView(true);
// document.getElementById("backView").onclick = () => cameraView(false);

document.getElementById("frontView").onclick = () => cameraView("front");
document.getElementById("backView").onclick = () => cameraView("back");
document.getElementById("leftView").onclick = () => cameraView("left");
document.getElementById("rightView").onclick = () => cameraView("right");
document.getElementById("homeView").onclick = () => cameraView("home");

function cameraView(view) {
  const camera = currentScene.activeCamera;
  if (!(camera instanceof BABYLON.ArcRotateCamera)) return;

  const animationDuration = 30;

  let targetAlpha = camera.alpha;
  let targetBeta = camera.beta;
  let targetRadius = camera.radius;

  switch (view) {
    case "front":
      targetAlpha = -Math.PI / 2;
      targetBeta = Math.PI / 2.1;
      break;
    case "back":
      targetAlpha = Math.PI / 2;
      targetBeta = Math.PI / 2.1;
      break;
    case "left":
      targetAlpha = Math.PI;
      targetBeta = Math.PI / 2.1;
      break;
    case "right":
      targetAlpha = 0;
      targetBeta = Math.PI / 2.1;

      break;
    case "home":
      targetAlpha = -Math.PI / 4; // 45° perspective view
      targetBeta = Math.PI / 3; // slightly elevated
      break;
  }

  // Animate alpha
  const alphaAnim = new BABYLON.Animation(
    "alphaAnim",
    "alpha",
    60,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT
  );
  alphaAnim.setKeys([
    { frame: 0, value: camera.alpha },
    { frame: animationDuration, value: targetAlpha },
  ]);

  // Animate beta
  const betaAnim = new BABYLON.Animation(
    "betaAnim",
    "beta",
    60,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT
  );
  betaAnim.setKeys([
    { frame: 0, value: camera.beta },
    { frame: animationDuration, value: targetBeta },
  ]);

  // Animate radius if home view
  const radiusAnim = new BABYLON.Animation(
    "radiusAnim",
    "radius",
    60,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT
  );
  radiusAnim.setKeys([
    { frame: 0, value: camera.radius },
    { frame: animationDuration, value: targetRadius },
  ]);

  const animations = [alphaAnim, betaAnim];
  if (view === "home") animations.push(radiusAnim);

  camera.animations = animations;
  currentScene.beginAnimation(camera, 0, animationDuration, false);
}

function showHideAlpha(scene, show) {
  scene.meshes.forEach((mesh) => {
    const mat = mesh.material;
    if (
      mat &&
      typeof mat.alpha === "number" &&
      (mat.alpha === 0.0 || mat.alpha === 0.3)
    ) {
      mat.alpha = show ? 0.3 : 0.0;
      console.log(`Updated alpha for: ${mesh.name}`);
    }
  });
}

document.getElementById("loadSceneBtn").onclick = () => {
  document.getElementById("loadFileInput").click();
};

document.getElementById("loadFileInput").onchange = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const fileURL = URL.createObjectURL(file);

  BABYLON.SceneLoader.Load(
    "",
    fileURL,
    engine,
    function (loadedScene) {
      if (currentScene) {
        loadedScene.manager = currentScene.manager;
      }
      currentScene = loadedScene;

      if (!currentScene.manager) {
        currentScene.manager =  new GLBMeshManager(currentScene);
      }

      if (!loadedScene.activeCamera) {
        loadedScene.createDefaultCamera(true);
      }
      if (loadedScene.lights.length === 0) {
        loadedScene.createDefaultLight(true);
      }

      loadedScene.activeCamera.attachControl(canvas, true);
      attachEvents(loadedScene);
      engine.runRenderLoop(() => {
        loadedScene.render();
      });
    },
    null,
    function (_, message, exception) {
      console.error("Failed to load scene:", message, exception);
    }
  );
};
