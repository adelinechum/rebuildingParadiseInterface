// AC I had to change the file location 'three' to '../../../build/three.module.js'

import { Color } from '../three.js-master/build/three.module.js';
import * as THREE from '../three.js-master/examples/build/three.module.js';

import Stats from '../three.js-master/examples/jsm/libs/stats.module.js';
import { PointerLockControls } from '../three.js-master/examples/jsm/controls/PointerLockControls.js';
import { OrbitControls } from '../three.js-master/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from '../three.js-master/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from '../three.js-master/examples/jsm/loaders/DRACOLoader.js';
import { MapControls } from '../three.js-master/examples/jsm/controls/OrbitControls.js';
// import { Matrix3 } from '../three.js-master/src/math/Matrix3.js';
// import { MathUtils } from '../three.js-master/src/math/MathUtils.js';
// import { Vector3 } from '../math/Vector3.js';
// import { Matrix4 } from '../math/Matrix4.js';

var container, camera, controls, scene, renderer;
const clock = new THREE.Clock();

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
var objects = []
let INTERSECTED;

//var objectPositions = []
var objectPositions = []

var mouse = { x : 0, y : 0 };

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const staticCamHeight = 200;
var cameraHeight = 180

init();
animate();
window.addEventListener( 'pointermove', onPointerMove);        
window.requestAnimationFrame(render);

const stats = new Stats();
let mixer;

var allChildren;

function init() {

  scene = new THREE.Scene();

  // get the container element from the DOM
  container = document.getElementById('container');

  // create the rendered and set it to the height/width of the container
  renderer = new THREE.WebGLRenderer();
  //renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setClearColor ('white', 1); // this is the background color seen while scene is loading
  container.appendChild( renderer.domElement );

  // create PerspectiveCamera (FieldofView default 60 ,AspectRatio,NearView, FarView)
  camera = new THREE.PerspectiveCamera( 40, container.clientWidth / container.clientHeight, 10, 50000 );
  camera.position.set( -701, cameraHeight , 255); // starting position of the camera
  
  controls = new MapControls( camera, renderer.domElement );
  controls.target.set(-828, 120, 398)
  //controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)
  controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
  controls.dampingFactor = 0.1;
 // controls.autoRotate = true
  //controls.maxDistance = 33000; // 35847 magnitude of camera position vector
  controls.maxZoom = 1;
  controls.maxPolarAngle = Math.PI / 2;

  controls.screenSpacePanning = false;

  controls.minDistance = 200;
  controls.maxDistance = 400;

  //horizontal rotation
  controls.minAzimuthAngle = - Infinity; // default
  controls.maxAzimuthAngle = Infinity; // default
  //vertical rotation
  controls.maxPolarAngle = Math.PI / 2.5;
  controls.minPolarAngle = 0;

  renderer.domElement.addEventListener( 'click', renderView, false );
  renderer.domElement.addEventListener( 'pointermove', raycast, false );

  // White directional light at full intensity shining from the top.
  const directionalLight = new THREE.DirectionalLight( 0xffffff, .9 );
  scene.add( directionalLight );

// load scene
const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath( '../three.js-master/examples/js/libs/draco/gltf/' );

    const gltfloader = new GLTFLoader();
    gltfloader.setDRACOLoader( dracoLoader );
    gltfloader.load( './assets/220419_InterfaceModel.glb', 
   
      function ( gltf ) {

      const model = gltf.scene;
      model.position.set( 1, 1, 0 );
      model.scale.set( 0.05, 0.05, 0.05 );
      scene.add( model );
      scene.fog = new THREE.Fog( 'white', 150, 2200 );

      mixer = new THREE.AnimationMixer( model );
      mixer.clipAction( gltf.animations[ 0 ] ).play();
      mixer.timeScale = 2; //Increased Animation Speed

       //loop through to find renderView names
       scene.children.forEach(child => {
        child.children.forEach(grandchild => {

          if (grandchild.name.match('^0')) {
            objects.push(grandchild);
                }
          
        })
        //console.log(objectPositions);
       });

      // get object world position
      scene.updateMatrixWorld(true);
      objects.matrixAutoUpdate = true;

      objects.forEach(worldPosition);

      function worldPosition(element){
        var position = new THREE.Vector3();
        position.getPositionFromMatrix( element.matrixWorld );
       // objectPositions.push( element, position );
        objectPositions.push({name: element.name, position: position});
      }

      console.log(objectPositions);
      
      animate();
    }, undefined, function ( e ) {

      console.error( e );

    },
 );

  // listen for changes to the window size to update the canvas
  window.addEventListener( 'resize', onWindowResize, false );
  
  document.addEventListener( 'pointermove', onPointerMove );

  function animate() {


    requestAnimationFrame( animate );
    const delta = clock.getDelta();
    mixer.update( delta );
    controls.update();
    stats.update();
    renderer.render( scene, camera );
  
  }

}


function onPointerMove( event ) {

  pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}

// function for handling resize events
function onWindowResize() {

  camera.aspect = container.clientWidth / container.clientHeight;
  renderer.setSize( container.clientWidth, container.clientHeight );

}

// animates the scene
function animate() {

  requestAnimationFrame( animate );
  const time = performance.now();

  // raycast of camera body with objects not pointer
    if ( controls.isLocked === true ) {

      raycaster.ray.origin.copy( controls.getObject().position );
      raycaster.ray.origin.y -= 10;

      const intersections = raycaster.intersectObjects( objects, false );

      const onObject = intersections.length > 0;

      const delta = ( time - prevTime ) / 1000;

      velocity.x -= velocity.x * 1.0 * delta;
      velocity.z -= velocity.z * 1.0 * delta;

      velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

      direction.z = Number( moveForward ) - Number( moveBackward );
      direction.x = Number( moveRight ) - Number( moveLeft );
      direction.normalize(); // this ensures consistent movements in all directions

      if ( moveForward || moveBackward ) velocity.z -= direction.z * 400.0 * delta;
      if ( moveLeft || moveRight ) velocity.x -= direction.x * 400.0 * delta;

      if ( onObject === true ) {
        console.log("intesected with object!");

        //velocity.y = Math.max( 0, velocity.y );
        canJump = true;

      }

      controls.moveRight( - velocity.x * delta );
      controls.moveForward( - velocity.z * delta );

      controls.getObject().position.y += ( velocity.y * delta ); // new behavior

      // floor lower bounding limits
      if ( controls.getObject().position.y < staticCamHeight) {

        velocity.y = 0;
        controls.getObject().position.y = staticCamHeight;
        canJump = true;

      }

    }
  
  //controls.update();
  
  prevTime = time;
  //console.log(camera.position)
  render();

}

function render() {
//console.log(camera.position);
//console.log(camera.lookAt);
//console.log(camera.lookAt);
//console.log(controls.target);
  renderer.render( scene, camera ); 
}

// object hover to highlight
function raycast ( e ) {
  
      raycaster.setFromCamera( pointer, camera );    
      var intersects = raycaster.intersectObjects( objects );
      // console.log(objects);
      
      // if there are intersections
      if ( intersects.length > 0 ) {

        //console.log(intersects[0]);

        // if INTERSECTED is new
        if ( INTERSECTED != intersects[ 0 ].object ) {

          // if INTERSECTED is saved, set it to it's original colour
          if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );

          // set new INTERSECTED
          INTERSECTED = intersects[ 0 ].object;
          // save original colour
          INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
          // set new colour
          INTERSECTED.material.emissive.setHex( 0xffff00 );

        }

      } else {//else there are no intersections

        // if we have an INTSERSECTED saved, set it to original colour and remove INTERSECTED
        if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
        INTERSECTED = null;

      }

  }

  // object click to view render
function renderView ( e ) {

  if (INTERSECTED) {
    console.log(INTERSECTED.name);
    var image = document.getElementById(INTERSECTED.name);
    image.style.display = 'flex';
  }
  else{

    Array.from(document.getElementsByClassName("displayImages")).forEach(function (e) {
      e.style.display = 'none';
    })
  }
}

document.getElementById("01").addEventListener("click", goToView, false)
document.getElementById("02").addEventListener("click", goToView, false)
document.getElementById("03").addEventListener("click", goToView, false)
document.getElementById("04").addEventListener("click", goToView, false)
document.getElementById("05").addEventListener("click", goToView, false)
document.getElementById("06").addEventListener("click", goToView, false)
document.getElementById("07").addEventListener("click", goToView, false)

//console.log(objects.matrixWorld.Object.getPosition());
// console.log(objects);
 console.log(objectPositions)

function goToView (parameter) {
  var viewID = parameter.target.id
 // console.log(parameter.target.id);
  switch (viewID) {
    case "01":
             //console.log(objectPositions[0].position);
              const position1 = objectPositions.filter(position => position.name.match('^01'))[0].position 
              console.log(position1);
              camera.position.set(position1.x -100, cameraHeight, position1.z+ 100);
              controls.target.set(position1.x, position1.y, position1.z);
               
      break;

    case "02": 
              const position2 = objectPositions.filter(position => position.name.match('^02'))[0].position 
              camera.position.set(position2.x -100, cameraHeight, position2.z+ 100);
              controls.target.set(position2.x, position2.y, position2.z);
    break;

    case "03":              
              const position3 = objectPositions.filter(position => position.name.match('^03'))[0].position 
              camera.position.set(position3.x -100, cameraHeight, position3.z+ 100);
              controls.target.set(position3.x, position3.y, position3.z);

    break;

    case "04":
              const position4 = objectPositions.filter(position => position.name.match('^04'))[0].position 
              camera.position.set(position4.x -100, cameraHeight, position4.z+ 100);
              controls.target.set(position4.x, position4.y, position4.z);
    break;

    case "05":
              const position5 = objectPositions.filter(position => position.name.match('^05'))[0].position 
              camera.position.set(position5.x -100, cameraHeight, position5.z+ 100);
              controls.target.set(position5.x, position5.y, position5.z);
    break;

    case "06":
              const position6 = objectPositions.filter(position => position.name.match('^06'))[0].position 
              camera.position.set(position6.x -100, cameraHeight, position6.z+ 100);
              controls.target.set(position6.x, position6.y, position6.z);
    break;

    case "07":
              const position7 = objectPositions.filter(position => position.name.match('^07'))[0].position 
              camera.position.set(position7.x -100, cameraHeight, position7.z+ 100);
              controls.target.set(position7.x, position7.y, position7.z);
    break;
  
    default:  camera.position.set( -701, cameraHeight , 255); 
              controls.target.set(-828, 120, 398);
      break;
  }
}

		/* When the user clicks on the button, 
		toggle between hiding and showing the dropdown content */
		function myFunction() {
		  document.getElementById("myDropdown").classList.toggle("show");
		}
		
		// Close the dropdown if the user clicks outside of it
		window.onclick = function(event) {
		  if (!event.target.matches('.dropbtn')) {
			var dropdowns = document.getElementsByClassName("dropdown-content");
			var i;
			for (i = 0; i < dropdowns.length; i++) {
			  var openDropdown = dropdowns[i];
			  if (openDropdown.classList.contains('show')) {
				openDropdown.classList.remove('show');
			  }
			}
		  }
		}



