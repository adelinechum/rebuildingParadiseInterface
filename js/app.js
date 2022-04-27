// AC I had to change the file location 'three' to '../../../build/three.module.js'

import * as THREE from '../three.js-master/examples/build/three.module.js';
import Stats from '../three.js-master/examples/jsm/libs/stats.module.js';
import { GLTFLoader } from '../three.js-master/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from '../three.js-master/examples/jsm/loaders/DRACOLoader.js';
import { MapControls } from '../three.js-master/examples/jsm/controls/OrbitControls.js';

var script = document.createElement('script');
script.src = 'https://code.jquery.com/jquery-3.4.1.min.js';
script.type = 'text/javascript';
document.getElementsByTagName('head')[0].appendChild(script);

var container, camera, controls, scene, renderer;
const clock = new THREE.Clock();

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
var objects = []
let INTERSECTED;
var animated = []
var groundItems = []

var objectPositions = []
var cameraHeight = 150

init();
animate();
window.addEventListener( 'pointermove', onPointerMove);        
window.requestAnimationFrame(render);

const stats = new Stats();
let mixer;

function init() {

  scene = new THREE.Scene();

  // get the container element from the DOM
  container = document.getElementById('container');

  // create the rendered and set it to the height/width of the container
  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setClearColor ('white', 1); // this is the background color seen while scene is loading
  container.appendChild( renderer.domElement );
  renderer.setPixelRatio(window.devicePixelRatio)

  // create PerspectiveCamera (FieldofView default 60 ,AspectRatio,NearView, FarView)
  camera = new THREE.PerspectiveCamera( 40, container.clientWidth / container.clientHeight, 10, 50000 );
  camera.position.set( -701, cameraHeight , 255); // starting position of the camera


  controls = new MapControls( camera, renderer.domElement );
  controls.target.set(-828, 120, 398)
  controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
  controls.dampingFactor = 0.1;
  controls.maxZoom = 1;
  controls.maxPolarAngle = Math.PI / 2;
  controls.screenSpacePanning = false;
  controls.minDistance = 200;
  controls.maxDistance = 400;

  //horizontal rotation
  controls.minAzimuthAngle = - Infinity; // default
  controls.maxAzimuthAngle = Infinity; // default

  //vertical rotation
  controls.maxPolarAngle = Math.PI / 2;
  controls.minPolarAngle = 0;

  renderer.domElement.addEventListener( 'click', renderView, false );
  renderer.domElement.addEventListener( 'pointermove', raycast, false );

  // White directional light at shining from the top.
  const directionalLight = new THREE.DirectionalLight( 0xffffff, 2 );
  scene.add( directionalLight );

// load scene
const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath( '../three.js-master/examples/js/libs/draco/gltf/' );

    const gltfloader = new GLTFLoader();
    gltfloader.setDRACOLoader( dracoLoader );
    gltfloader.load( './assets/220425_InterfaceModel.glb', 
   
      function ( gltf ) {

      const model = gltf.scene;
      model.position.set( 1, 1, 0 );
      model.scale.set( 0.05, 0.05, 0.05 );
      scene.add( model );
      scene.fog = new THREE.Fog( 'white', 150, 1200 );

      mixer = new THREE.AnimationMixer( model );
      mixer.clipAction( gltf.animations[ 0 ] ).play();
      mixer.timeScale = 2; //Increased Animation Speed

       //loop through to find renderView and animated objects names
       scene.children.forEach(child => {
        child.children.forEach(grandchild => {

          if (grandchild.name.match('^0')) {
            objects.push(grandchild);
           }

           if (grandchild.name.match('^Animated')) {
            animated.push(grandchild);
           }

           if (grandchild.name.match('^Ground')) {
            groundItems.push(grandchild);
           }


        })
       });

        // get object world position
        scene.updateMatrixWorld(true);
        objects.matrixAutoUpdate = true;
        animated.matrixAutoUpdate = true;
        groundItems.matrixAutoUpdate = true;

        objects.forEach(worldPosition);
        animated.forEach(worldPosition);
        groundItems.forEach(worldPosition);

        function worldPosition(element){
          var position = new THREE.Vector3();
          position.getPositionFromMatrix( element.matrixWorld );
          objectPositions.push({name: element.name, position: position});

        }
       console.log(scene.children);

          //buildings
          const m1 = new THREE.MeshBasicMaterial({color: 'grey'});
          const buildings = scene.children[1].children[2].children[1]
          buildings.material = m1
          // buildings.receiveShadow = true;
          // buildings.material.emissive = 'white';

          //Directional Light
          const light = scene.children[0]
          light.visible = false

          //plane
          // const groundPlane = scene.children[1].children[8]
          // const m2 = new THREE.MeshLambertMaterial({color: 'white'});
          // groundPlane.material = m2

          const skyColor = 'gainsboro';  
          const groundColor = 'black';  
          const intensity = .8;
          const light2 = new THREE.HemisphereLight(skyColor, groundColor, intensity);
          scene.add(light2);

          const light3 = new THREE.AmbientLight( 0x404040, 1); // soft white light
          scene.add( light3 );
        

      animate();
    }, undefined, function ( e ) {

      console.error( e );

    },
 );

//block onclick  Enter interface
 const blocker = document.getElementById( 'blocker' );
 const instructions = document.getElementById( 'instructions' );

 instructions.addEventListener( 'click', function () {

  instructions.style.display = 'none';
  blocker.style.display = 'none';

 } );

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
  //prevTime = time;
  render();

}

function render() {
  renderer.render( scene, camera ); 
}

// object hover to highlight
function raycast ( e ) {
  
      raycaster.setFromCamera( pointer, camera );    
      var intersects = raycaster.intersectObjects( objects );
      
      // if there are intersections
      if ( intersects.length > 0 ) {

        // if INTERSECTED is new
        if ( INTERSECTED != intersects[ 0 ].object ) {
          
          if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );// if INTERSECTED is saved, set it to it's original colour

          INTERSECTED = intersects[ 0 ].object; // set new INTERSECTED
          INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex(); // save original colour
          INTERSECTED.material.emissive.setHex( 0xffff00 ); // set new colour

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
   // console.log(INTERSECTED.name);
    var image = document.getElementById(INTERSECTED.name);
    image.style.display = 'flex';
  }
  else{

    Array.from(document.getElementsByClassName("displayImages")).forEach(function (e) {
      e.style.display = 'none';
    })
  }
}

//escape image
document.body.addEventListener( 'keydown', function (e) { 
  if (e.key == "Escape") {
    Array.from(document.getElementsByClassName("displayImages")).forEach(function (e) {
      e.style.display = 'none';
    })
  }
} );

// Scenes go to camera position
document.getElementById("01").addEventListener("click", goToView, false) //city plan
document.getElementById("02").addEventListener("click", goToView, false) // single fam house
document.getElementById("03").addEventListener("click", goToView, false) //ponds
document.getElementById("04").addEventListener("click", goToView, false) // built out house
document.getElementById("05").addEventListener("click", goToView, false) //logging
document.getElementById("06").addEventListener("click", goToView, false) // wildlands
document.getElementById("07").addEventListener("click", goToView, false) // regional plan

// Sidepanel go to scenes
document.getElementById("wildfire").addEventListener("click", goToView, false)
document.getElementById("smoke").addEventListener("click", goToView, false)
document.getElementById("precipitation").addEventListener("click", goToView, false)
document.getElementById("ponds").addEventListener("click", goToView, false)
document.getElementById("transport").addEventListener("click", goToView, false)
document.getElementById("Stationary").addEventListener("click", goToView, false)
document.getElementById("drone").addEventListener("click", goToView, false)
document.getElementById("predator").addEventListener("click", goToView, false)
document.getElementById("mammal").addEventListener("click", goToView, false)
document.getElementById("reptile").addEventListener("click", goToView, false)
document.getElementById("bird").addEventListener("click", goToView, false)

console.log(objectPositions);

function goToView (parameter) {
  var viewID = parameter.target.id
  switch (viewID) {
    case "01":
              const position1 = objectPositions.filter(position => position.name.match('^01'))[0].position 
              camera.position.set(position1.x -300, cameraHeight, position1.z+ 300);
              controls.target.set(position1.x, position1.y, position1.z);  
      break;

    case "02": 
              const position2 = objectPositions.filter(position => position.name.match('^02'))[0].position 
              camera.position.set(position2.x -300, cameraHeight, position2.z+ 300);
              controls.target.set(position2.x, position2.y, position2.z);
    break;

    case "03":              
              const position3 = objectPositions.filter(position => position.name.match('^05'))[0].position 
              camera.position.set(position3.x -300, cameraHeight, position3.z+ 300);
              controls.target.set(position3.x, position3.y, position3.z);

    break;

    case "04":
              const position4 = objectPositions.filter(position => position.name.match('^04'))[0].position 
              camera.position.set(position4.x -300, cameraHeight, position4.z+ 300);
              controls.target.set(position4.x, position4.y, position4.z);
    break;

    case "05":
              const position5 = objectPositions.filter(position => position.name.match('^03'))[0].position 
              camera.position.set(position5.x -150, cameraHeight, position5.z+ 150);
              controls.target.set(position5.x, position5.y, position5.z);
    break; 

    case "Stationary":
      const position5a = objectPositions.filter(position => position.name.match('^03'))[0].position 
      camera.position.set(position5a.x -150, cameraHeight, position5a.z+ 150);
      controls.target.set(position5a.x, position5a.y, position5a.z);
    break; 

    case "06":
              const position6 = objectPositions.filter(position => position.name.match('^06'))[0].position 
              camera.position.set(position6.x -150, cameraHeight, position6.z+ 150);
              controls.target.set(position6.x, position6.y, position6.z);
    break;

    case "drone":
      const position6a = objectPositions.filter(position => position.name.match('^06'))[0].position 
      camera.position.set(position6a.x -150, cameraHeight, position6a.z+ 150);
      controls.target.set(position6a.x, position6a.y, position6a.z);
    break;

    case "07":
              const position7 = objectPositions.filter(position => position.name.match('^07'))[0].position 
              camera.position.set(position7.x -300, cameraHeight, position7.z+ 300);
              controls.target.set(position7.x, position7.y, position7.z);
    break;

    case "wildfire":
      const position8 = objectPositions.filter(position => position.name.match('Animated_Fire'))[0].position 
      camera.position.set(position8.x -300, cameraHeight, position8.z+ 300);
      controls.target.set(position8.x, position8.y, position8.z);  
    break;

      case "smoke": 
            const position9 = objectPositions.filter(position => position.name.match('Animated_Smoke2'))[0].position 
            camera.position.set(position9.x -300, cameraHeight, position9.z+ 300);
            controls.target.set(position9.x, position9.y, position9.z);
      break;

      case "precipitation":              
            const position10 = objectPositions.filter(position => position.name.match('Animated_Clouds'))[0].position 
            camera.position.set(position10.x -300, cameraHeight, position10.z+ 300);
            controls.target.set(position10.x, position10.y, position10.z);

      break;

      case "ponds":
            const position11 = objectPositions.filter(position => position.name.match('^05'))[0].position
            camera.position.set(position11.x -300, cameraHeight, position11.z+ 300);
            controls.target.set(position11.x, position11.y, position11.z);
      break;

      case "reptile": 
            const position12 = objectPositions.filter(position => position.name.match('Animated_Reptile'))[0].position 
            camera.position.set(position12.x +100, cameraHeight, position12.z+ 100);
            controls.target.set(position12.x, position12.y, position12.z);
      break;

      case "bird":              
            const position13 = objectPositions.filter(position => position.name.match('Animated_Bird'))[0].position 
            camera.position.set(position13.x -100, cameraHeight, position13.z+ 100);
            controls.target.set(position13.x, position13.y, position13.z);

      break;

      case "mammal":
            const position14 = objectPositions.filter(position => position.name.match('Animated_Mammal'))[0].position 
            camera.position.set(position14.x -300, cameraHeight, position14.z+ 300);
            controls.target.set(position14.x, position14.y, position14.z);
      break;

      case "predator":
        const position15 = objectPositions.filter(position => position.name.match('Animated_Predator'))[0].position 
        camera.position.set(position15.x -100, cameraHeight+100, position15.z+ 100);
        controls.target.set(position15.x, position15.y, position15.z);
      break;

      case "transport":
            const position16 = objectPositions.filter(position => position.name.match('Animated_Car'))[0].position 
            camera.position.set(position16.x -300, cameraHeight, position16.z+ 300);
            controls.target.set(position16.x, position16.y, position16.z);
      break;
        
    default:  camera.position.set( -701, cameraHeight , 255); 
              controls.target.set(-828, 120, 398);
      break;
  }
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


var TEXTS = [
  "Wind NE 6.9mph Light", 
  "Wind N 6.9mph Light", 
  "Wind NNW 5.7mph Light", 
  "Wind ENE 3.4mph Light",
  "Wind NNE 6.9mph Light", 
  "Wind NNE 7.1mph Light", 
  "Wind NNE 8.1mph Gentle", 
  "Wind WNW 3.4mph Gentle",
  "Wind WNW 10.3mph Gentle", 
  "Wind NW 11.3mph Gentle",
  "Wind NW 12.7mph Moderate",
  "Wind WNW 13.4mph Moderate",
  "Wind WNW 13.3mph Moderate", 
  "Wind NW 16.2mph Moderate",
  "Wind NW 16.7mph Moderate",
  "Wind WNW 12.3mph Gentle", 
  "Wind WNW 11.3mph Gentle",
  "Wind NW 10.7mph Moderate",
  "Wind WNW 9.4mph Moderate",
  "Wind NW 8.3mph Moderate", 
  "Wind NNE 7.9mph Light", 
  "Wind NNE 7.1mph Light", 
  "Wind NE 5.8mph Light", 
  "Wind N 4.9mph Light"
];

var index = 0;

$(function() {
  setInterval(function() {
    $('#wind-text-change').fadeOut(100, function() {
      $(this).text(TEXTS[index++]).fadeIn(100);
      if (index === TEXTS.length)
        index = 0
    });
  }, 9000);
});