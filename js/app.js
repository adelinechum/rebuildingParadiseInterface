// built off Triceratops example https://www.food4rhino.com/en/app/triceratops

import * as THREE from '../three.js-master/examples/build/three.module.js';

import { OrbitControls } from '../three.js-master/examples/jsm/controls/OrbitControls.js';

//import { FirstPersonControls } from '../three.js-master/examples/jsm/controls/FirstPersonControls.js';

var camera, controls, scene, renderer;

const clock = new THREE.Clock();

//console.log(window.location.href)

init();
animate();

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

  // create camera (default field of view is 60)
  // PerspectiveCamera (FieldofView,AspectRatio,NearView, FarView)
  camera = new THREE.PerspectiveCamera( 30, container.clientWidth / container.clientHeight, 1, 100000000000 );
  camera.position.set( -34178, 6000, 8989); // starting position of the camera
  // TO DO fix this camera.lookAt(camera.position);

  //TO DO fix camera zoom out


  console.log(camera.position)

  //camera controls to allow for orbiting
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; // creates a softer orbiting feel
  controls.dampingFactor = 0.1; // determines how soft
  controls.screenSpacePanning = true;
  controls.maxPolarAngle = Math.PI / 2;

  //controls = new FirstPersonControls( camera, renderer.domElement );
  //controls.movementSpeed = 150;
  //controls.lookSpeed = 0.1;


  // this is only required when using RectAreaLight
  // RectAreaLightUniformsLib.init();

  // load scene
  var loader = new THREE.ObjectLoader();

  loader.load(
  	// resource URL
  	"./assets/groundPoints.json",

  	// onLoad callback
  	function ( obj ) {
      // remove the loading text
      document.getElementById('progress').remove();
      

  		// assign the loaded object to the scene variable
  		scene = obj;
      scene.fog = new THREE.Fog( 'black', 20, 50000 );
  	},

  	// onProgress callback
  	 function ( xhr ) {
      progressText( xhr ) // delete this if you don't want the progress text
  	 },

  	// onError callback
  	function ( err ) {
  		console.error( 'An error happened' );
      console.log('error found');
      console.log('ERROR FOUND: ' + err);
  	}
  );

  // listen for changes to the window size to update the canvas
  window.addEventListener( 'resize', onWindowResize, false );

}

// adds progress text while the model is loading
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

  // console.log(text);

  progress = document.createElement('DIV');
  progress.id = 'progress';
  textNode = document.createTextNode(text);
  progress.appendChild(textNode)
  container.appendChild(progress)
}

// function for handling resize events
function onWindowResize() {

  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( container.clientWidth, container.clientHeight );

}

// animates the scene
function animate() {

  requestAnimationFrame( animate );
 //console.log(camera.position) //use to set initial camera
  controls.update();
  render();

}

function render() {
  controls.update( clock.getDelta() );
  renderer.render( scene, camera );

}
