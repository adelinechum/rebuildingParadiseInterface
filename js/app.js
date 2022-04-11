// AC I had to change the file location 'three' to '../../../build/three.module.js'

import { Color } from '../three.js-master/build/three.module.js';
import * as THREE from '../three.js-master/examples/build/three.module.js';

import Stats from '../three.js-master/examples/jsm/libs/stats.module.js';
import { PointerLockControls } from '../three.js-master/examples/jsm/controls/PointerLockControls.js';
import { OrbitControls } from '../three.js-master/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from '../three.js-master/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from '../three.js-master/examples/jsm/loaders/DRACOLoader.js';


var container, camera, controls, scene, renderer;
const clock = new THREE.Clock();

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const threshold = 0.1;
var objects = [];

var raycasterPointer = new THREE.Raycaster();
var mouse = { x : 0, y : 0 };

var liveCameras = []
var historicalPts = []
var sinCounter = 0; 

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const vertex = new THREE.Vector3();

//center of bounding box
var center;

//Bounding box to find center
// const box = new THREE.Box3()
//console.log(window.location.href)

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
  renderer.setClearColor ('black', 1); // this is the background color seen while scene is loading
  container.appendChild( renderer.domElement );

  // create PerspectiveCamera (FieldofView default 60 ,AspectRatio,NearView, FarView)
  camera = new THREE.PerspectiveCamera( 30, container.clientWidth / container.clientHeight, 1, 50000 );

  // camera.maxDistance= 1000
  camera.position.set( -1705, 197, 2500); // starting position of the camera
  //console.log(camera.position)
  // camera.position.z = 100;

  console.log(camera.position)

  //camera controls to allow for orbiting
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; // creates a softer orbiting feel
  controls.dampingFactor = 0.1; // determines how soft
  controls.enableZoom = true;
  controls.maxDistance = 33000; // 35847 magnitude of camera position vector
  //controls.maxZoom = 1;
  controls.maxPolarAngle = Math.PI / 2;
  //controls.autoRotate = true;
  controls.screenSpacePanning = true;


  controls = new PointerLockControls( camera, document.body );

  document.body.addEventListener( 'click', function () {
  } );

  document.body.addEventListener( 'keydown', function (e) {
    if (e.key == "Shift") {
      controls.unlock();
    }
  } );

  document.body.addEventListener( 'keydown', function (e) {
    //console.log(e);
    if (e.key == "Escape") {
      console.log("escape pressed");
      blocker.style.display = 'block';  
      instructions.style.display = '';
    }
  } );

  document.body.addEventListener( 'keyup', function (e) {
    if (e.key == "Shift") {
      controls.lock();
    }
  } );

  const blocker = document.getElementById( 'blocker' );
  const instructions = document.getElementById( 'instructions' );

  instructions.addEventListener( 'click', function () {
    controls.lock();
  } );

  controls.addEventListener( 'lock', function () {

    instructions.style.display = 'none';
    blocker.style.display = 'none';

  } );

  // controls.addEventListener( 'unlock', function () {

  //   blocker.style.display = 'block';
  //   instructions.style.display = '';

  // } );

  scene.add( controls.getObject() );

  const onKeyDown = function ( event ) {

    switch ( event.code ) {

      case 'ArrowUp':
      case 'KeyW':
        moveForward = true;
        break;

      case 'ArrowLeft':
      case 'KeyA':
        moveLeft = true;
        break;

      case 'ArrowDown':
      case 'KeyS':
        moveBackward = true;
        break;

      case 'ArrowRight':
      case 'KeyD':
        moveRight = true;
        break;

      case 'Space':
        if ( canJump === true ) velocity.y += 350;
        canJump = false;
        break;

    }

  };

  const onKeyUp = function ( event ) {

    switch ( event.code ) {

      case 'ArrowUp':
      case 'KeyW':
        moveForward = false;
        break;

      case 'ArrowLeft':
      case 'KeyA':
        moveLeft = false;
        break;

      case 'ArrowDown':
      case 'KeyS':
        moveBackward = false;
        break;

      case 'ArrowRight':
      case 'KeyD':
        moveRight = false;
        break;

    }

  };

  document.addEventListener( 'keydown', onKeyDown );
  document.addEventListener( 'keyup', onKeyUp );

  raycasterPointer = new THREE.Raycaster();
  renderer.domElement.addEventListener( 'click', raycast, false );

  // floor 
  // TO DO REMOVE THIS AFTER TOPO MESH INCLUDED

  let floorGeometry = new THREE.PlaneGeometry( 2000, 2000, 100, 100000 );
  floorGeometry.rotateX( - Math.PI / 2 );

  // // vertex displacement

  // let position = floorGeometry.attributes.position;

  // for ( let i = 0, l = position.count; i < l; i ++ ) {

  //   vertex.fromBufferAttribute( position, i );

  //   vertex.x += Math.random() * 20 - 10;
  //   vertex.y += Math.random() * 2;
  //   vertex.z += Math.random() * 20 - 10;

  //   position.setXYZ( i, vertex.x, vertex.y, vertex.z );

  // }

  const floorMaterial = new THREE.MeshBasicMaterial({'color':'grey'})

  const floor = new THREE.Mesh( floorGeometry, floorMaterial );
  scene.add( floor );

// load scene
const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath( '../three.js-master/examples/js/libs/draco/gltf/' );

    const gltfloader = new GLTFLoader();
    gltfloader.setDRACOLoader( dracoLoader );
    gltfloader.load( './assets/220410_Test3.glb', 
   
      function ( gltf ) {

      const model = gltf.scene;
      model.position.set( 1, 1, 0 );
      model.scale.set( 0.05, 0.05, 0.05 );
      scene.add( model );
      //scene.fog = new THREE.Fog( 'black', 20, 3000 );

      const testCam1 = new THREE.BoxGeometry(100,100,100,100,100,100)

      mixer = new THREE.AnimationMixer( model );
      mixer.clipAction( gltf.animations[ 0 ] ).play();

      console.log(scene.children);

      // adding all the points in the "Scene" mesh
      // TODO: this is breakable!!!
      //objects = scene.children[2].children[0].children;
      objects = scene.children[2]

      console.log(scene.children[2])

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
  
    //controls.update();
  
    stats.update();
  
    renderer.render( scene, camera );
  
  }

}

/* // adds progress text while the model is loading
function progressText( xhr ) {
  var progress, textNode, text;

  if (document.getElementById('progress')) {
    document.getElementById('progress').remove();
  }

  if (xhr.lengthComputable) {
    text = 'loading: ' + Math.round((xhr.loaded / xhr.total * 100)) + '%'
  } else {
    text = 'loading: ' + Math.round(xhr.loaded / 1000) + 'kb'
  }

  progress = document.createElement('DIV');
  progress.id = 'progress';
  textNode = document.createTextNode(text);
  progress.appendChild(textNode)
  container.appendChild(progress)
} */

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

// controls object jumping speed
  sinCounter = sinCounter + (Math.PI / 32);

  requestAnimationFrame( animate );

  const time = performance.now();

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

      velocity.y = Math.max( 0, velocity.y );
      canJump = true;

    }

    controls.moveRight( - velocity.x * delta );
    controls.moveForward( - velocity.z * delta );

    controls.getObject().position.y += ( velocity.y * delta ); // new behavior

    if ( controls.getObject().position.y < 10 ) {

      velocity.y = 0;
      controls.getObject().position.y = 10;

      canJump = true;

    }

  }
  
  //controls.update();

  // live cam & historical points animate
  liveCameras.forEach(element => {
    element.rotation.y -= 0.05;
  });  

  historicalPts.forEach(element => {
    //element.rotation.y -= 0.05;
    element.translateY((Math.sin(sinCounter) * 25));
  });  
  
  prevTime = time;
  //console.log(camera.position)
  render();

}

function render() { 
  // update the picking ray with the camera and pointer position
	raycasterPointer.setFromCamera( pointer, camera );

	// calculate objects intersecting the picking ray
	const intersects = raycasterPointer.intersectObjects( scene.children, true );

  raycasterPointer.params.Points.threshold = 10; // don't know why threshold this high


  for ( let i = 0; i < intersects.length; i ++ ) {
    //console.log(intersects [i] ); // this is not printing
   //intersects[i].object.material.color.set ("red");

  }

  //controls.update( clock.getDelta() );
  renderer.render( scene, camera ); 
}

function raycast ( e ) {
  // Step 1: Detect light helper
      //1. sets the mouse position with a coordinate system where the center
      //   of the screen is the origin
      mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
      mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1;
  
      //2. set the picking ray from the camera position and mouse coordinates
      raycasterPointer.setFromCamera( mouse, camera );    
  
      //3. compute intersections (note the 2nd parameter)
      var intersects = raycasterPointer.intersectObjects( scene.children, true );
      raycasterPointer.params.Points.threshold = 10; // don't know why threshold this high
  
      for ( var i = 0; i < intersects.length; i++ ) {
          console.log( intersects[ i ] ); 

      }
  // Step 2: Detect normal objects
      //1. sets the mouse position with a coordinate system where the center of the screen is the origin
      mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
      mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1;
  
      //2. set the picking ray from the camera position and mouse coordinates
      raycasterPointer.setFromCamera( mouse, camera );    
  
      //3. compute intersections (no 2nd parameter true anymore)
      var intersects = raycasterPointer.intersectObjects( scene.children );
  
      for ( var i = 0; i < intersects.length; i++ ) {
          //console.log( intersects[ i ] ); 
          /*
              An intersection has the following properties :
                  - object : intersected object (THREE.Mesh)
                  - distance : distance from camera to intersection (number)
                  - face : intersected face (THREE.Face3)
                  - faceIndex : intersected face index (number)
                  - point : intersection point (THREE.Vector3)
                  - uv : intersection point in the object's UV coordinates (THREE.Vector2)
          */
      }
  
  }


