// AC I had to change the file location 'three' to '../../../build/three.module.js'

import { Color } from '../three.js-master/build/three.module.js';
import * as THREE from '../three.js-master/examples/build/three.module.js';

import { OrbitControls } from '../three.js-master/examples/jsm/controls/OrbitControls.js';
import { GLTFExporter } from '../three.js-master/examples/jsm/exporters/GLTFExporter.js';
import { GUI } from '../three.js-master/examples/jsm/libs/lil-gui.module.min.js';
import { Flow } from '../three.js-master/examples/jsm/modifiers/CurveModifier.js';
import { InstancedFlow } from '../three.js-master/examples/jsm/modifiers/CurveModifier.js';


// TO DO 
//First Person Ref: https://threejs.org/examples/?q=pointer#misc_controls_pointerlock
//Loading multiple files: https://redstapler.co/load-multiple-model-three-js-promise/
// for cars https://hofk.de/main/discourse.threejs/2021/MotionAlongCurve/MotionAlongCurve.html

function exportGLTF( input ) {

  const gltfExporter = new GLTFExporter();

  const options = {
    trs: params.trs,
    onlyVisible: params.onlyVisible,
    truncateDrawRange: params.truncateDrawRange,
    binary: params.binary,
    maxTextureSize: params.maxTextureSize
  };
  gltfExporter.parse(
    input,
    function ( result ) {

      if ( result instanceof ArrayBuffer ) {

        saveArrayBuffer( result, 'scene.glb' );

      } else {

        const output = JSON.stringify( result, null, 2 );
        console.log( output );
        saveString( output, 'scene.gltf' );

      }

    },
    function ( error ) {

      console.log( 'An error happened during parsing', error );

    },
    options
  );

}

const link = document.createElement( 'a' );
link.style.display = 'none';
document.body.appendChild( link ); // Firefox workaround, see #6594

function save( blob, filename ) {

  link.href = URL.createObjectURL( blob );
  link.download = filename;
  link.click();

  // URL.revokeObjectURL( url ); breaks Firefox...

}

function saveString( text, filename ) {

  save( new Blob( [ text ], { type: 'text/plain' } ), filename );

}


function saveArrayBuffer( buffer, filename ) {

  save( new Blob( [ buffer ], { type: 'application/octet-stream' } ), filename );

}


let  object, object2, material, geometry, scene1, scene2;
let gridHelper, sphere, waltHead;

const params = {
  trs: false,
  onlyVisible: true,
  truncateDrawRange: true,
  binary: false,
  maxTextureSize: 4096,
  exportScene1: exportScene1,
  exportScenes: exportScenes,
  exportSphere: exportSphere,
  exportHead: exportHead,
  exportObjects: exportObjects,
  exportSceneObject: exportSceneObject
};

var container, camera, controls, scene, renderer;
const clock = new THREE.Clock();

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const threshold = 0.1;

var liveCameras = []
var historicalPts = []
var sinCounter = 0; 

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
      console.log(scene.children);

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

      //loop through to find camera names
      scene.children.forEach(child => {
        //console.log(child.name)
        if (child.name.match('^liveCam')) {
          liveCameras.push(child);
        }
      });

      //loop through to find historical points
      scene.children.forEach(child => {
        if (child.name.match('^historicalPt')) {
          historicalPts.push(child);
        }
      });

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

  
  const gui = new GUI();

  let h = gui.addFolder( 'Settings' );
  h.add( params, 'trs' ).name( 'Use TRS' );
  h.add( params, 'onlyVisible' ).name( 'Only Visible Objects' );
  h.add( params, 'truncateDrawRange' ).name( 'Truncate Draw Range' );
  h.add( params, 'binary' ).name( 'Binary (GLB)' );
  h.add( params, 'maxTextureSize', 2, 8192 ).name( 'Max Texture Size' ).step( 1 );

  h = gui.addFolder( 'Export' );
  h.add( params, 'exportScene1' ).name( 'Export Scene 1' );
  h.add( params, 'exportScenes' ).name( 'Export Scene 1 and 2' );
  h.add( params, 'exportSphere' ).name( 'Export Sphere' );
  h.add( params, 'exportHead' ).name( 'Export Head' );
  h.add( params, 'exportObjects' ).name( 'Export Sphere With Grid' );
  h.add( params, 'exportSceneObject' ).name( 'Export Scene 1 and Object' );

  gui.open();

}

function exportScene1() {

  exportGLTF( scene );

}

function exportScenes() {

  exportGLTF( [ scene1, scene2 ] );

}

function exportSphere() {

  exportGLTF( sphere );

}

function exportHead() {

  exportGLTF( waltHead );

}

function exportObjects() {

  exportGLTF( [ sphere, gridHelper ] );

}

function exportSceneObject() {

  exportGLTF( [ scene1, gridHelper ] );

}


//





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

// controls object jumping speed
  sinCounter = sinCounter + (Math.PI / 32);

  requestAnimationFrame( animate );
  
  controls.update();

  // live cam & historical points animate
  liveCameras.forEach(element => {
    element.rotation.y -= 0.05;
  });  
//TO DO change to move up and down
  historicalPts.forEach(element => {
    //element.rotation.y -= 0.05;
    element.translateY((Math.sin(sinCounter) * 25));
  });  
 
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