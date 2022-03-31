// built off Triceratops example https://www.food4rhino.com/en/app/triceratops

import * as THREE from '../three.js-master/examples/build/three.module.js';

import { OrbitControls } from '../three.js-master/examples/jsm/controls/OrbitControls.js';
import { Box3 } from '../three.js-master/examples/jsm/controls/three.module.js';

//import { FirstPersonControls } from '../three.js-master/examples/jsm/controls/FirstPersonControls.js';

// TO DO 
//First Person Ref: https://threejs.org/examples/?q=pointer#misc_controls_pointerlock
//

var container, camera, controls, scene, renderer;
const clock = new THREE.Clock();

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const threshold = 0.1;

//center of bounding box
var center;

//Bounding box to find center
// const box = new THREE.Box3()

//console.log(window.location.href)

init();
animate();
window.addEventListener( 'pointermove', onPointerMove);        
window.requestAnimationFrame(render);

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
  camera.position.set( -34178, 6000, 8989); // starting position of the camera

  // TO DO fix this camera.lookAt(camera.position);
  //TO DO fix max camera zoom out

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


  // load scene
  var loader = new THREE.ObjectLoader();

  loader.load(
  	// resource URL
  	"./assets/groundPoints.json",
   // "./assets/camerasRenders.json",



  	// onLoad callback
  	function ( obj ) {
      // remove the loading text
      document.getElementById('progress').remove();
      
  		// assign the loaded object to the scene variable
  		scene = obj;
      console.log(scene.children)

      console.log(scene);
      scene.fog = new THREE.Fog( 'black', 20, 50000 );

      //bounding box to get center of objects
      var bbox = new THREE.Box3().setFromObject(obj);
      //console.log(bbox);
      center = new THREE.Vector3();
      console.log(bbox.getCenter(center));
      console.log(center);
      controls.target = center;
      console.log(scene.children);
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
  document.addEventListener( 'pointermove', onPointerMove );

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

  progress = document.createElement('DIV');
  progress.id = 'progress';
  textNode = document.createTextNode(text);
  progress.appendChild(textNode)
  container.appendChild(progress)
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
  
  controls.update();
  render();

}


function render() { 
  // update the picking ray with the camera and pointer position
	raycaster.setFromCamera( pointer, camera );

	// calculate objects intersecting the picking ray
	const intersects = raycaster.intersectObjects( scene.children, true );
  raycaster.params.Points.threshold = 10; // don't know why threshold this high


  for ( let i = 0; i < intersects.length; i ++ ) {
    console.log(intersects [i] ); // this is not printing

    //intersects[i].object.material.color.set ("red");

  }

  controls.update( clock.getDelta() );
  renderer.render( scene, camera ); 
}




