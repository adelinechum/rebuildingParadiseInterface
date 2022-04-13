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
var groundLimits = []
let INTERSECTED;

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
const staticCamHeight = 150;

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
  camera = new THREE.PerspectiveCamera( 30, container.clientWidth / container.clientHeight, 10, 50000 );
  console.log(camera.position)
  // camera.maxDistance= 1000
  camera.position.set( -1500, staticCamHeight, 2500); // starting position of the camera
  
  // //camera controls to allow for orbiting
  // controls = new OrbitControls(camera, renderer.domElement);
  // controls.enableDamping = true; // creates a softer orbiting feel
  // controls.dampingFactor = 0.1; // determines how soft
  // controls.enableZoom = true;
  // controls.maxDistance = 33000; // 35847 magnitude of camera position vector
  // //controls.maxZoom = 1;
  // controls.maxPolarAngle = Math.PI / 2;
  // //controls.autoRotate = true;
  // controls.screenSpacePanning = true;


  controls = new PointerLockControls( camera, document.body );

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

  renderer.domElement.addEventListener( 'click', renderView, false );
  renderer.domElement.addEventListener( 'pointermove', raycast, false );

// load scene
const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath( '../three.js-master/examples/js/libs/draco/gltf/' );

    const gltfloader = new GLTFLoader();
    gltfloader.setDRACOLoader( dracoLoader );
    gltfloader.load( './assets/220411_InterfaceModelExport.glb', 
   
      function ( gltf ) {

      const model = gltf.scene;
      model.position.set( 1, 1, 0 );
      model.scale.set( 0.05, 0.05, 0.05 );
      scene.add( model );
      scene.fog = new THREE.Fog( 'black', 150, 2200 );

      mixer = new THREE.AnimationMixer( model );
      mixer.clipAction( gltf.animations[ 0 ] ).play();

      //objects = scene.children[2].children;
      //console.log(objects);
      //console.log(scene.children)

       //loop through to find renderView names
       scene.children.forEach(child => {
        child.children.forEach(grandchild => {

          if (grandchild.name.match('^0')) {
            objects.push(grandchild);

          }
        })
       });


       //loop to rename renderViews 
       objects.forEach(element => {

        //naming files here

       });


      console.log(objects);

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
      //raycaster.ray.origin.y += 100;

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

  // //controls.update( clock.getDelta() );
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

          // console.log(INTERSECTED.material);

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

    // console.log(document.getElementsByClassName("displayImages"));

    Array.from(document.getElementsByClassName("displayImages")).forEach(function (e) {
      e.style.display = 'none';
    })
  }

  //AC HERE need to call renders

}

function goTo(paramater) {
  console.log("go to");
  switch (paramater) {
    case 1:
      // go to 1 location
      break;

    case 2:
      // go to 2 location
    break;
  
    default:
      break;
  }
}



