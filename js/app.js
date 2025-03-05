// 太阳系3D模拟 - 主要JavaScript代码
// 使用Three.js创建一个交互式太阳系模拟

// 纹理加载器
const textureLoader = new THREE.TextureLoader();

// 行星数据（相对比例，非真实比例）
const PLANET_DATA = {
    sun: {
        name: "太阳",
        radius: 20,
        distance: 0,
        color: 0xffcc00,
        rotationSpeed: 0.004,
        orbitalSpeed: 0,
        tilt: 0,
        details: "太阳系的中心天体，一颗G型主序星。直径约1,392,000公里，质量是地球的333,000倍。",
        earthViewScale: 0.3 // 地球视角下的缩放比例
    },
    mercury: {
        name: "水星",
        radius: 0.8,
        distance: 30,
        color: 0x8a8a8a,
        rotationSpeed: 0.004,
        orbitalSpeed: 0.04,
        tilt: 0.03,
        details: "太阳系最小和最内侧的行星，没有卫星。表面布满陨石坑，几乎没有大气层。"
    },
    venus: {
        name: "金星",
        radius: 1.9,
        distance: 40,
        color: 0xe39e1c,
        rotationSpeed: 0.002,
        orbitalSpeed: 0.015,
        tilt: 177.3,
        details: "太阳系中最热的行星，表面温度可达462°C。有浓密的二氧化碳大气层，造成强烈的温室效应。"
    },
    earth: {
        name: "地球",
        radius: 2,
        distance: 50,
        color: 0x2727e6,
        rotationSpeed: 0.01,
        orbitalSpeed: 0.01,
        tilt: 23.4,
        details: "我们的家园，太阳系中唯一已知存在生命的行星。表面71%被水覆盖，有氧气丰富的大气层。",
        texture: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
        bumpMap: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg',
        specularMap: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg',
        hasTexture: true,
        hasMoon: true // 添加标记表示地球有卫星
    },
    moon: {
        name: "月球",
        radius: 0.5, // 月球半径约为地球的1/4
        distance: 4, // 月球轨道半径
        color: 0xcccccc,
        rotationSpeed: 0.004, // 月球自转速度
        orbitalSpeed: 0.04, // 月球绕地球公转速度
        tilt: 6.7, // 月球轨道倾角
        details: "地球唯一的自然卫星，直径约3,474公里。月球表面布满陨石坑，没有大气层。",
        texture: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg',
        bumpMap: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_bump.jpg',
        hasTexture: true
    },
    mars: {
        name: "火星",
        radius: 1.5,
        distance: 60,
        color: 0xc1440e,
        rotationSpeed: 0.008,
        orbitalSpeed: 0.008,
        tilt: 25.2,
        details: "被称为红色星球，表面有明显的氧化铁。有两个小卫星：火卫一和火卫二。"
    },
    jupiter: {
        name: "木星",
        radius: 7,
        distance: 80,
        color: 0xd8ca9d,
        rotationSpeed: 0.04,
        orbitalSpeed: 0.002,
        tilt: 3.1,
        details: "太阳系最大的行星，一个气态巨行星。有著名的大红斑风暴和至少79颗卫星。"
    },
    saturn: {
        name: "土星",
        radius: 6,
        distance: 110,
        color: 0xead6b8,
        rotationSpeed: 0.038,
        orbitalSpeed: 0.0009,
        tilt: 26.7,
        details: "以其壮观的环系统而闻名，主要由冰粒子和岩石碎片组成。有82颗已知卫星。"
    },
    uranus: {
        name: "天王星",
        radius: 4,
        distance: 140,
        color: 0xa6fff8,
        rotationSpeed: 0.03,
        orbitalSpeed: 0.0004,
        tilt: 97.8,
        details: "一个冰巨行星，独特之处在于它的自转轴几乎与轨道平面平行。有27颗已知卫星。"
    },
    neptune: {
        name: "海王星",
        radius: 3.8,
        distance: 170,
        color: 0x3d85c6,
        rotationSpeed: 0.032,
        orbitalSpeed: 0.0001,
        tilt: 28.3,
        details: "太阳系最外层的行星（自冥王星被重新分类后），有强烈的风暴系统和14颗已知卫星。"
    }
};

// 全局变量
let scene, camera, renderer, controls;
let planets = {};
let rings = {};
let orbits = {};
let selectedPlanet = null;
let rotationSpeedMultiplier = 1.0;
let orbitalSpeedMultiplier = 1.0;
let isEarthView = false;
let earthViewRotation = 0;
let earthViewRotationSpeed = 0.005;
let defaultCameraPosition = { x: 0, y: 50, z: 150 }; // 增加高度和距离，确保更好的视角
let earthSurfaceViewOffset = { x: 0.2, y: 0.1, z: 0.2 }; // 地球表面视角偏移量

// 画中画视图变量
let pipScene, pipCamera, pipRenderer;
let pipIndicator;

// 地球表面观察位置参数
let observerLatitude = 45; // 观察者纬度（默认45度）
let observerLongitude = 0; // 观察者经度（默认0度）
let timeOfDay = 0; // 一天中的时间（0-24小时）
let dayNightCycle = true; // 是否启用昼夜循环
let dayNightCycleSpeed = 0.1; // 昼夜循环速度

// 初始化函数
function init() {
    // 创建场景
    scene = new THREE.Scene();
    
    // 创建相机
    camera = new THREE.PerspectiveCamera(
        75, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        1000
    );
    camera.position.z = defaultCameraPosition.z;
    camera.position.y = defaultCameraPosition.y;
    
    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000);
    document.getElementById('container').appendChild(renderer.domElement);
    
    // 添加轨道控制
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // 添加控制器事件监听器，跟踪用户交互状态
    controls.userInteracting = false;
    controls.hasInteracted = false; // 添加标志，跟踪用户是否曾经交互过
    
    controls.addEventListener('start', function() {
        controls.userInteracting = true;
        controls.hasInteracted = true; // 一旦用户开始交互，就设置标志
    });
    
    controls.addEventListener('end', function() {
        controls.userInteracting = false;
        // 注意：hasInteracted标志不会重置，一旦用户交互过，它就会保持为true
    });
    
    // 添加星空背景
    createStars();
    
    // 添加行星
    createPlanets();
    
    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);
    
    // 添加点光源（太阳光）
    const sunLight = new THREE.PointLight(0xffffff, 1.5, 300);
    scene.add(sunLight);
    
    // 初始化画中画视图（在行星创建之后）
    initPipView();
    
    // 添加窗口大小调整事件监听器
    window.addEventListener('resize', onWindowResize, false);
    
    // 添加鼠标点击事件
    window.addEventListener('click', onMouseClick, false);
    
    // 设置速度控制
    setupSpeedControls();
    
    // 设置视角控制
    setupViewControls();
    
    // 设置聊天功能
    setupChatFeature();
    
    // 开始动画循环
    animate();
}

// 设置速度控制
function setupSpeedControls() {
    // 自转速度控制
    const rotationSpeedSlider = document.getElementById('rotation-speed');
    const rotationSpeedValue = document.getElementById('rotation-speed-value');
    
    rotationSpeedSlider.addEventListener('input', function() {
        rotationSpeedMultiplier = parseFloat(this.value);
        rotationSpeedValue.textContent = rotationSpeedMultiplier.toFixed(1);
    });
    
    // 公转速度控制
    const orbitalSpeedSlider = document.getElementById('orbital-speed');
    const orbitalSpeedValue = document.getElementById('orbital-speed-value');
    
    orbitalSpeedSlider.addEventListener('input', function() {
        orbitalSpeedMultiplier = parseFloat(this.value);
        orbitalSpeedValue.textContent = orbitalSpeedMultiplier.toFixed(1);
    });
}

// 设置视角控制
function setupViewControls() {
    const earthViewToggle = document.getElementById('earth-view-toggle');
    const resetViewButton = document.getElementById('reset-view');
    const earthViewControls = document.getElementById('earth-view-controls');
    const pipToggleButton = document.getElementById('pip-toggle');
    
    // 地球视角切换
    earthViewToggle.addEventListener('click', function() {
        isEarthView = !isEarthView;
        
        if (isEarthView) {
            // 切换到地球视角
            this.textContent = '切换到太阳视角';
            this.classList.add('active');
            
            // 显示地球视角控制面板
            earthViewControls.style.display = 'block';
            
            // 更新轨道显示
            updateOrbitsVisibility(false);
            
            // 调整太阳大小
            adjustSunSizeForEarthView(true);
            
            // 定位相机到地球表面
            positionCameraOnEarthSurface();
            
            // 重置交互标志，以便视角能够自动更新
            controls.hasInteracted = false;
            
            // 立即更新太阳位置
            updateSunPosition();
        } else {
            // 切换回太阳视角
            this.textContent = '切换到地球视角';
            this.classList.remove('active');
            
            // 隐藏地球视角控制面板
            earthViewControls.style.display = 'none';
            
            // 先恢复太阳原始位置，再重置相机位置
            // 这样可以避免相机位于太阳内部
            if (planets['sun'] && planets['sun'].mesh) {
                planets['sun'].mesh.position.set(0, 0, 0);
            }
            
            // 恢复太阳原始大小
            adjustSunSizeForEarthView(false);
            
            // 更新轨道显示
            updateOrbitsVisibility(true);
            
            // 重置相机位置（确保相机不在太阳内部）
            resetCameraControls();
            
            // 恢复地球可见性
            if (planets['earth'] && planets['earth'].mesh) {
                planets['earth'].mesh.visible = true;
            }
            
            // 重置交互标志，以便视角能够自动更新
            controls.hasInteracted = false;
        }
    });
    
    // 重置视角按钮
    resetViewButton.addEventListener('click', function() {
        resetCameraControls();
        
        // 如果在地球视角模式下重置视角，确保地球仍然不可见
        if (isEarthView && planets['earth'] && planets['earth'].mesh) {
            planets['earth'].mesh.visible = false;
            
            // 更新太阳位置
            updateSunPosition();
        } else if (!isEarthView && planets['earth'] && planets['earth'].mesh) {
            // 如果在太阳视角模式下重置视角，确保地球可见
            planets['earth'].mesh.visible = true;
            
            // 恢复太阳原始位置
            if (planets['sun'] && planets['sun'].mesh) {
                planets['sun'].mesh.position.set(0, 0, 0);
            }
        }
    });
    
    // 画中画视图切换按钮
    pipToggleButton.addEventListener('click', function() {
        const pipView = document.getElementById('pip-view');
        
        if (pipView.style.display === 'none') {
            // 显示画中画视图
            pipView.style.display = 'block';
            this.textContent = '隐藏全局视图';
            this.classList.add('active');
        } else {
            // 隐藏画中画视图
            pipView.style.display = 'none';
            this.textContent = '显示全局视图';
            this.classList.remove('active');
        }
    });
    
    // 地球表面观察位置控制
    const latitudeSlider = document.getElementById('observer-latitude');
    const latitudeValue = document.getElementById('latitude-value');
    
    latitudeSlider.addEventListener('input', function() {
        observerLatitude = parseFloat(this.value);
        latitudeValue.textContent = observerLatitude;
        
        if (isEarthView) {
            updateObserverPosition();
            updateSunPosition(); // 更新太阳位置
        }
    });
    
    const longitudeSlider = document.getElementById('observer-longitude');
    const longitudeValue = document.getElementById('longitude-value');
    
    longitudeSlider.addEventListener('input', function() {
        observerLongitude = parseFloat(this.value);
        longitudeValue.textContent = observerLongitude;
        
        if (isEarthView) {
            updateObserverPosition();
            updateSunPosition(); // 更新太阳位置
        }
    });
    
    const timeSlider = document.getElementById('time-of-day');
    const timeValue = document.getElementById('time-value');
    
    timeSlider.addEventListener('input', function() {
        timeOfDay = parseFloat(this.value);
        timeValue.textContent = timeOfDay.toFixed(1);
        
        if (isEarthView) {
            updateObserverPosition();
            updateSunPosition(); // 更新太阳位置
        }
    });
    
    const dayNightCycleCheckbox = document.getElementById('day-night-cycle');
    
    dayNightCycleCheckbox.addEventListener('change', function() {
        dayNightCycle = this.checked;
    });
    
    const cycleSpeedSlider = document.getElementById('day-night-speed');
    const cycleSpeedValue = document.getElementById('cycle-speed-value');
    
    cycleSpeedSlider.addEventListener('input', function() {
        dayNightCycleSpeed = parseFloat(this.value);
        cycleSpeedValue.textContent = dayNightCycleSpeed.toFixed(2);
    });
}

// 调整太阳大小以适应地球视角
function adjustSunSizeForEarthView(isEarthView) {
    if (!planets['sun']) return;
    
    const sun = planets['sun'].mesh;
    const sunData = PLANET_DATA.sun;
    
    if (isEarthView) {
        // 地球视角下，太阳应该看起来更大更亮
        // 调整太阳的大小，使其在远处看起来更自然
        const scale = sunData.earthViewScale * 15; // 增大15倍，确保太阳在地球视角下清晰可见
        sun.scale.set(scale, scale, scale);
        
        // 大幅增加太阳的亮度
        if (sun.material) {
            sun.material.emissiveIntensity = 3.0;
            sun.material.emissive = new THREE.Color(0xffcc00);
        }
        
        // 添加更大更明显的光晕效果
        if (!sun.halo) {
            const haloGeometry = new THREE.SphereGeometry(sunData.radius * 6.0, 32, 32);
            const haloMaterial = new THREE.MeshBasicMaterial({
                color: 0xffcc00,
                transparent: true,
                opacity: 0.4,
                side: THREE.BackSide
            });
            sun.halo = new THREE.Mesh(haloGeometry, haloMaterial);
            sun.add(sun.halo);
        } else {
            // 如果光晕已存在，调整其大小
            sun.halo.scale.set(6.0, 6.0, 6.0);
            sun.halo.material.opacity = 0.4;
        }
        
        // 显示光晕
        if (sun.halo) {
            sun.halo.visible = true;
        }
        
        // 确保太阳是可见的
        sun.visible = true;
        
        // 添加太阳点光源，增强亮度效果
        if (!sun.light) {
            sun.light = new THREE.PointLight(0xffcc00, 2.0, 1000);
            sun.add(sun.light);
        } else {
            sun.light.intensity = 2.0;
            sun.light.visible = true;
        }
    } else {
        // 恢复太阳原始大小
        sun.scale.set(1, 1, 1);
        
        // 恢复原始亮度
        if (sun.material) {
            sun.material.emissiveIntensity = 1.0;
            sun.material.emissive = new THREE.Color(0x000000);
        }
        
        // 如果光晕存在，恢复其原始大小
        if (sun.halo) {
            sun.halo.scale.set(1.0, 1.0, 1.0);
            sun.halo.visible = false;
        }
        
        // 关闭太阳点光源
        if (sun.light) {
            sun.light.visible = false;
        }
    }
}

// 更新轨道显示
function updateOrbitsVisibility(visible) {
    scene.traverse(function(object) {
        // 找到所有轨道线条
        if (object instanceof THREE.Line) {
            object.visible = visible;
        }
    });
}

// 重置相机控制器
function resetCameraControls() {
    // 恢复轨道控制器默认设置
    controls.enabled = true;
    controls.minDistance = 30; // 增加最小距离，避免进入太阳内部
    controls.maxDistance = 300;
    controls.target.set(0, 0, 0);
    
    // 重置相机位置，确保不在太阳内部
    // 增加y轴高度，以便从上方俯视太阳系
    camera.position.set(
        defaultCameraPosition.x,
        defaultCameraPosition.y + 20, // 增加高度
        defaultCameraPosition.z
    );
    
    // 重置交互标志，以便视角能够自动更新
    controls.hasInteracted = false;
    
    // 更新控制器
    controls.update();
}

// 将相机定位到地球表面
function positionCameraOnEarthSurface() {
    if (!planets['earth']) return;
    
    // 选中地球并显示信息
    selectedPlanet = 'earth';
    updatePlanetInfo('earth');
    
    // 保持轨道控制器启用，但修改其设置
    controls.enabled = true;
    
    // 限制轨道控制器的缩放范围，防止缩放太远
    controls.minDistance = PLANET_DATA.earth.radius * 1.2;
    controls.maxDistance = PLANET_DATA.earth.radius * 10;
    
    // 设置地球为控制器的目标
    controls.target.copy(planets['earth'].mesh.position);
    
    // 确保太阳是可见的
    if (planets['sun'] && planets['sun'].mesh) {
        planets['sun'].mesh.visible = true;
    }
    
    // 先更新太阳位置，确保太阳在正确的位置
    updateSunPosition();
    
    // 定位到地球表面
    updateObserverPosition();
    
    // 确保再次调用updateSunPosition确保太阳位置正确
    updateSunPosition();
    
    // 将相机朝向正东方向（初始化视角）
    const earthPosition = planets['earth'].mesh.position.clone();
    const eastVector = new THREE.Vector3(1, 0, 0); // 东方向量
    const cameraDirection = camera.getWorldDirection(new THREE.Vector3());
    
    // 如果相机未朝向东方，则调整相机方向
    if (cameraDirection.dot(eastVector) < 0.9) {
        camera.lookAt(earthPosition.clone().add(eastVector.multiplyScalar(100)));
    }
    
    // 重置交互标志，以便视角能够自动更新
    controls.hasInteracted = false;
    
    // 更新控制器
    controls.update();
    
    // 打印调试信息
    console.log("已切换到地球视角，太阳位置已更新");
    console.log("太阳位置:", planets['sun'].mesh.position);
    console.log("相机位置:", camera.position);
}

// 创建星空背景
function createStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.7,
        sizeAttenuation: false
    });
    
    const starsVertices = [];
    for (let i = 0; i < 10000; i++) {
        const x = Math.random() * 2000 - 1000;
        const y = Math.random() * 2000 - 1000;
        const z = Math.random() * 2000 - 1000;
        starsVertices.push(x, y, z);
    }
    
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);
}

// 创建行星
function createPlanets() {
    // 遍历行星数据创建每个行星
    for (const [key, data] of Object.entries(PLANET_DATA)) {
        // 跳过月球，因为它会作为地球的卫星创建
        if (key === 'moon') continue;
        
        // 创建行星几何体和材质
        const geometry = new THREE.SphereGeometry(data.radius, 32, 32);
        let material;
        
        if (key === 'sun') {
            // 太阳使用自发光材质
            material = new THREE.MeshBasicMaterial({ color: data.color });
        } else if (data.hasTexture) {
            // 使用纹理贴图的行星
            const texture = textureLoader.load(data.texture);
            
            // 创建带纹理的材质
            material = new THREE.MeshPhongMaterial({ 
                map: texture,
                shininess: 5
            });
            
            // 如果有凹凸贴图，添加它
            if (data.bumpMap) {
                const bumpTexture = textureLoader.load(data.bumpMap);
                material.normalMap = bumpTexture;
                material.normalScale = new THREE.Vector2(0.05, 0.05);
            }
            
            // 如果有高光贴图，添加它
            if (data.specularMap) {
                const specularTexture = textureLoader.load(data.specularMap);
                material.specularMap = specularTexture;
            }
        } else {
            // 其他行星使用标准材质
            material = new THREE.MeshStandardMaterial({ 
                color: data.color,
                roughness: 0.7,
                metalness: 0.2
            });
        }
        
        // 创建行星网格
        const planet = new THREE.Mesh(geometry, material);
        
        // 设置行星位置
        planet.position.x = data.distance;
        
        // 设置行星倾斜角度
        planet.rotation.z = THREE.MathUtils.degToRad(data.tilt);
        
        // 将行星添加到场景
        scene.add(planet);
        
        // 存储行星引用
        planets[key] = {
            mesh: planet,
            data: data,
            orbitAngle: Math.random() * Math.PI * 2 // 随机初始位置
        };
        
        // 为土星添加光环
        if (key === 'saturn') {
            createSaturnRings(planet, data.radius);
        }
        
        // 为行星创建轨道
        if (key !== 'sun') {
            createOrbit(data.distance);
        }
        
        // 如果行星有卫星，创建卫星
        if (data.hasMoon) {
            createMoon(planet, data);
        }
    }
}

// 创建土星环
function createSaturnRings(planet, planetRadius) {
    const innerRadius = planetRadius * 1.4;
    const outerRadius = planetRadius * 2.5;
    const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
    
    // 需要调整UV以便纹理正确显示
    const pos = ringGeometry.attributes.position;
    const v3 = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
        v3.fromBufferAttribute(pos, i);
        ringGeometry.attributes.uv.setXY(i, v3.length() < (innerRadius + outerRadius) / 2 ? 0 : 1, 1);
    }
    
    const ringMaterial = new THREE.MeshStandardMaterial({
        color: 0xf8e8a0,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
        roughness: 0.7,
        metalness: 0.2
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    planet.add(ring);
    rings.saturn = ring;
}

// 创建轨道
function createOrbit(radius) {
    const orbitGeometry = new THREE.BufferGeometry();
    const orbitMaterial = new THREE.LineBasicMaterial({ 
        color: 0x444444,
        transparent: true,
        opacity: 0.3
    });
    
    const vertices = [];
    const segments = 128;
    
    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        vertices.push(
            radius * Math.cos(theta),
            0,
            radius * Math.sin(theta)
        );
    }
    
    orbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
    scene.add(orbit);
}

// 创建月球
function createMoon(planet, planetData) {
    const moonData = PLANET_DATA.moon;
    const geometry = new THREE.SphereGeometry(moonData.radius, 32, 32);
    
    let material;
    if (moonData.hasTexture) {
        const texture = textureLoader.load(moonData.texture);
        material = new THREE.MeshPhongMaterial({ 
            map: texture,
            shininess: 5
        });
        
        if (moonData.bumpMap) {
            const bumpTexture = textureLoader.load(moonData.bumpMap);
            material.normalMap = bumpTexture;
            material.normalScale = new THREE.Vector2(0.05, 0.05);
        }
    } else {
        material = new THREE.MeshStandardMaterial({ 
            color: moonData.color,
            roughness: 0.7,
            metalness: 0.2
        });
    }
    
    const moon = new THREE.Mesh(geometry, material);
    
    // 设置月球初始位置（在行星右侧）
    moon.position.x = moonData.distance;
    
    // 设置月球倾斜角度
    moon.rotation.z = THREE.MathUtils.degToRad(moonData.tilt);
    
    // 将月球添加到行星的子对象中
    planet.add(moon);
    
    // 存储月球引用
    planets.moon = {
        mesh: moon,
        data: moonData,
        orbitAngle: Math.random() * Math.PI * 2 // 随机初始位置
    };
    
    // 创建月球轨道
    createMoonOrbit(planet, moonData.distance);
}

// 创建月球轨道
function createMoonOrbit(planet, radius) {
    const orbitGeometry = new THREE.BufferGeometry();
    const orbitMaterial = new THREE.LineBasicMaterial({ 
        color: 0x666666,
        transparent: true,
        opacity: 0.2
    });
    
    const vertices = [];
    const segments = 64;
    
    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        vertices.push(
            radius * Math.cos(theta),
            0,
            radius * Math.sin(theta)
        );
    }
    
    orbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
    planet.add(orbit);
}

// 初始化画中画视图
function initPipView() {
    // 创建画中画场景
    pipScene = new THREE.Scene();
    
    // 创建画中画相机（使用正交相机以获得更好的俯视效果）
    pipCamera = new THREE.OrthographicCamera(
        -100, 100, 
        100, -100, 
        0.1, 1000
    );
    pipCamera.position.set(0, 200, 0);
    pipCamera.lookAt(0, 0, 0);
    
    // 创建画中画渲染器
    pipRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    pipRenderer.setSize(200, 200);
    pipRenderer.setClearColor(0x000000);
    document.getElementById('pip-view').appendChild(pipRenderer.domElement);
    
    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0x555555);
    pipScene.add(ambientLight);
    
    // 添加点光源（太阳光）
    const sunLight = new THREE.PointLight(0xffffff, 1.5, 300);
    pipScene.add(sunLight);
    
    // 复制行星到画中画场景
    createPipPlanets();
    
    // 创建位置指示器
    createPipIndicator();
}

// 创建画中画场景中的行星
function createPipPlanets() {
    // 为画中画视图创建太阳
    const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: PLANET_DATA.sun.color });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    pipScene.add(sun);
    
    // 为每个行星创建轨道和简化版行星
    for (const [key, data] of Object.entries(PLANET_DATA)) {
        if (key === 'sun' || key === 'moon') continue;
        
        // 创建轨道
        const orbitGeometry = new THREE.RingGeometry(data.distance - 0.5, data.distance + 0.5, 64);
        const orbitMaterial = new THREE.MeshBasicMaterial({
            color: 0x444444,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5
        });
        const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
        orbit.rotation.x = Math.PI / 2;
        pipScene.add(orbit);
        
        // 创建行星（简化版，只用小球代表）
        const planetGeometry = new THREE.SphereGeometry(data.radius * 0.5, 16, 16);
        const planetMaterial = new THREE.MeshBasicMaterial({ color: data.color });
        const planet = new THREE.Mesh(planetGeometry, planetMaterial);
        
        // 设置初始位置
        planet.position.x = data.distance;
        
        pipScene.add(planet);
        
        // 存储引用到对应的行星对象中
        if (planets[key]) {
            planets[key].pipMesh = planet;
        }
    }
}

// 创建画中画视图中的位置指示器
function createPipIndicator() {
    // 创建一个HTML元素作为指示器
    pipIndicator = document.createElement('div');
    pipIndicator.id = 'pip-indicator';
    document.getElementById('pip-view').appendChild(pipIndicator);
}

// 更新画中画视图中的位置指示器
function updatePipIndicator() {
    if (!pipIndicator) return;
    
    // 获取当前相机位置
    const cameraPosition = camera.position.clone();
    
    // 计算相机在画中画视图中的2D位置
    const vector = new THREE.Vector3();
    vector.copy(cameraPosition);
    
    // 将3D坐标转换为画中画视图中的2D坐标
    const pipWidth = 200;
    const pipHeight = 200;
    
    // 计算相对位置（基于太阳系的最大距离）
    const maxDistance = PLANET_DATA.neptune.distance + 10;
    const relX = (cameraPosition.x / maxDistance) * (pipWidth / 2) + (pipWidth / 2);
    const relZ = (cameraPosition.z / maxDistance) * (pipHeight / 2) + (pipHeight / 2);
    
    // 更新指示器位置
    pipIndicator.style.left = `${relX}px`;
    pipIndicator.style.top = `${relZ}px`;
}

// 窗口大小调整处理函数
function onWindowResize() {
    // 更新主相机
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // 不需要调整画中画视图大小，它是固定的
}

// 鼠标点击处理函数
function onMouseClick(event) {
    // 计算鼠标位置的标准化设备坐标
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // 创建射线投射器
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    // 获取所有行星的网格对象
    const planetMeshes = Object.values(planets).map(p => p.mesh);
    
    // 检测射线与行星的交点
    const intersects = raycaster.intersectObjects(planetMeshes);
    
    if (intersects.length > 0) {
        // 找到被点击的行星
        const clickedMesh = intersects[0].object;
        
        // 查找对应的行星键
        for (const [key, planet] of Object.entries(planets)) {
            if (planet.mesh === clickedMesh) {
                selectedPlanet = key;
                updatePlanetInfo(key);
                break;
            }
        }
    }
}

// 更新行星信息显示
function updatePlanetInfo(planetKey) {
    const planetData = PLANET_DATA[planetKey];
    const infoElement = document.getElementById('planet-info');
    
    infoElement.innerHTML = `
        <div class="planet-name">${planetData.name}</div>
        <div class="planet-details">${planetData.details}</div>
    `;
}

// 动画循环
function animate() {
    requestAnimationFrame(animate);
    
    // 更新轨道控制器
    controls.update();
    
    // 更新行星位置和旋转
    updatePlanets();
    
    // 如果是地球视角模式，更新地球表面视角
    if (isEarthView) {
        updateEarthSurfaceView();
    }
    
    // 更新画中画视图
    updatePipView();
    
    // 渲染场景
    renderer.render(scene, camera);
}

// 更新地球表面视角
function updateEarthSurfaceView() {
    if (!isEarthView || !planets['earth']) return;
    
    // 获取地球当前位置
    const earthPosition = planets['earth'].mesh.position.clone();
    
    // 确保地球在地球视角模式下不可见
    if (planets['earth'] && planets['earth'].mesh) {
        planets['earth'].mesh.visible = false;
    }
    
    // 如果启用了昼夜循环，更新时间
    if (dayNightCycle) {
        timeOfDay = (timeOfDay + dayNightCycleSpeed * 0.016) % 24; // 0.016是大约16ms的帧时间
        document.getElementById('time-value').textContent = timeOfDay.toFixed(1);
        document.getElementById('time-of-day').value = timeOfDay;
        
        // 只有在用户没有交互过的情况下，才自动更新观察位置
        // 这样用户手动调整视角后，视角会保持在用户设置的位置
        if (!controls.userInteracting && !controls.hasInteracted) {
            updateObserverPosition();
        }
    }
    
    // 更新太阳位置以模拟日出日落
    updateSunPosition();
    
    // 只有在用户从未交互过的情况下，才自动更新相机位置
    // 一旦用户交互过，就不再自动更新相机位置
    if (!controls.userInteracting && !controls.hasInteracted) {
        // 计算相机到地球的相对位置向量
        const cameraOffset = camera.position.clone().sub(earthPosition);
        
        // 保持相机与地球的相对位置不变
        camera.position.copy(earthPosition.clone().add(cameraOffset));
        
        // 更新控制器目标为地球位置
        controls.target.copy(earthPosition);
    }
    
    controls.update();
}

// 更新行星位置和旋转
function updatePlanets() {
    // 如果是地球视角，先保存地球位置
    let earthPosition = new THREE.Vector3();
    if (isEarthView && planets['earth']) {
        earthPosition = planets['earth'].mesh.position.clone();
    }
    
    // 更新所有行星
    for (const [key, planet] of Object.entries(planets)) {
        const data = planet.data;
        
        // 自转 (应用速度乘数)
        // 在地球视角模式下，地球不自转
        if (!(isEarthView && key === 'earth')) {
            planet.mesh.rotation.y += data.rotationSpeed * rotationSpeedMultiplier;
        }
        
        // 公转（太阳不公转）(应用速度乘数)
        if (key !== 'sun') {
            // 在地球视角模式下，地球不公转
            if (!(isEarthView && key === 'earth')) {
                // 更新轨道角度
                planet.orbitAngle += data.orbitalSpeed * orbitalSpeedMultiplier;
                
                // 计算新位置
                const x = Math.cos(planet.orbitAngle) * data.distance;
                const z = Math.sin(planet.orbitAngle) * data.distance;
                
                // 更新位置
                planet.mesh.position.x = x;
                planet.mesh.position.z = z;
            }
        }
    }
    
    // 更新月球位置
    if (planets.moon) {
        const moon = planets.moon;
        const moonData = moon.data;
        
        // 更新月球轨道角度
        moon.orbitAngle += moonData.orbitalSpeed * orbitalSpeedMultiplier;
        
        // 计算月球相对于地球的新位置
        const x = Math.cos(moon.orbitAngle) * moonData.distance;
        const z = Math.sin(moon.orbitAngle) * moonData.distance;
        
        // 更新月球位置
        moon.mesh.position.x = x;
        moon.mesh.position.z = z;
        
        // 月球自转
        moon.mesh.rotation.y += moonData.rotationSpeed * rotationSpeedMultiplier;
    }
    
    // 如果是地球视角，调整场景使地球保持在中心
    if (isEarthView && planets['earth']) {
        const newEarthPosition = planets['earth'].mesh.position.clone();
        const offset = newEarthPosition.clone().sub(earthPosition);
        
        // 移动所有行星（包括太阳）以保持地球在原位置
        for (const [key, planet] of Object.entries(planets)) {
            if (key !== 'earth' && key !== 'moon') {
                planet.mesh.position.sub(offset);
            }
        }
    }
}

// 设置聊天功能
function setupChatFeature() {
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    const chatMessages = document.getElementById('chat-messages');
    
    // 添加发送按钮点击事件
    chatSend.addEventListener('click', function() {
        sendChatMessage();
    });
    
    // 添加输入框回车事件
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });
    
    // 添加欢迎消息
    addBotMessage("你好！我是DeepSeek-R1，你可以问我关于宇宙和太阳系的问题。");
    
    // 发送聊天消息
    function sendChatMessage() {
        const message = chatInput.value.trim();
        if (message) {
            // 添加用户消息到聊天框
            addUserMessage(message);
            
            // 清空输入框
            chatInput.value = '';
            
            // 获取AI回复
            getAIResponse(message);
        }
    }
    
    // 添加用户消息到聊天框
    function addUserMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message user-message';
        messageElement.textContent = `你: ${message}`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // 添加机器人消息到聊天框
    function addBotMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message bot-message';
        messageElement.textContent = `DeepSeek: ${message}`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // 获取AI回复
    function getAIResponse(message) {
        // 显示加载中消息
        const loadingElement = document.createElement('div');
        loadingElement.className = 'chat-message bot-message';
        loadingElement.textContent = `DeepSeek: 思考中...`;
        loadingElement.id = 'loading-message';
        chatMessages.appendChild(loadingElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // 模拟AI思考时间
        setTimeout(() => {
            // 移除加载消息
            const loadingMessage = document.getElementById('loading-message');
            if (loadingMessage) {
                chatMessages.removeChild(loadingMessage);
            }
            
            // 根据问题提供相关回答
            const response = generateResponse(message);
            addBotMessage(response);
        }, 1000);
    }
    
    // 生成回复（简单的关键词匹配）
    function generateResponse(message) {
        message = message.toLowerCase();
        
        // 关于太阳系的问题
        if (message.includes('太阳系') || message.includes('solar system')) {
            if (message.includes('多少行星') || message.includes('几个行星') || message.includes('行星数量')) {
                return "太阳系中有8个行星：水星、金星、地球、火星、木星、土星、天王星和海王星。冥王星在2006年被重新归类为矮行星。";
            } else if (message.includes('最大') || message.includes('largest')) {
                return "木星是太阳系中最大的行星，直径约为142,984公里，是地球直径的11倍多。";
            } else if (message.includes('最小') || message.includes('smallest')) {
                return "水星是太阳系中最小的行星，直径约为4,879公里。";
            } else if (message.includes('年龄') || message.includes('多少岁') || message.includes('how old')) {
                return "太阳系的年龄约为46亿年，形成于一个巨大的分子云坍缩过程中。";
            } else {
                return "太阳系是以太阳为中心，包含八大行星、矮行星、卫星、小行星、彗星等天体的行星系统。";
            }
        }
        
        // 关于特定行星的问题
        else if (message.includes('地球') || message.includes('earth')) {
            if (message.includes('距离太阳') || message.includes('distance')) {
                return "地球距离太阳平均约1.496亿公里，这个距离被称为1天文单位(AU)。";
            } else if (message.includes('年龄') || message.includes('多少岁')) {
                return "地球的年龄约为45.4亿年。";
            } else if (message.includes('卫星') || message.includes('moon')) {
                return "地球只有一个自然卫星，即月球。月球直径约为3,474公里，是地球直径的约四分之一。";
            } else {
                return "地球是太阳系中第三颗行星，也是目前已知唯一孕育生命的天体。地球表面71%被水覆盖，拥有氧气丰富的大气层。";
            }
        }
        
        else if (message.includes('火星') || message.includes('mars')) {
            if (message.includes('生命') || message.includes('life')) {
                return "目前尚未在火星上发现确切的生命迹象，但科学家们发现了可能存在液态水的证据，这增加了火星可能曾经或现在仍然存在生命的可能性。";
            } else if (message.includes('殖民') || message.includes('colonization')) {
                return "火星殖民是人类未来可能的太空探索目标。多个航天机构和私人公司如SpaceX都在研究火星殖民的可能性。";
            } else {
                return "火星是太阳系中第四颗行星，被称为'红色星球'，因为其表面富含氧化铁（铁锈）。火星有两个小卫星：火卫一和火卫二。";
            }
        }
        
        else if (message.includes('木星') || message.includes('jupiter')) {
            return "木星是太阳系中最大的行星，是一个气态巨行星。它有著名的大红斑风暴系统，已经持续了至少400年。木星有79颗已知的卫星，其中最大的四颗被称为伽利略卫星。";
        }
        
        else if (message.includes('土星') || message.includes('saturn')) {
            return "土星是太阳系中第二大行星，以其壮观的环系统而闻名。土星的环主要由冰粒子和岩石碎片组成，宽度超过27万公里，但厚度只有约10米。";
        }
        
        // 关于宇宙的问题
        else if (message.includes('宇宙') || message.includes('universe')) {
            if (message.includes('年龄') || message.includes('多少岁') || message.includes('how old')) {
                return "根据现代宇宙学理论和观测数据，宇宙的年龄约为138亿年。";
            } else if (message.includes('大小') || message.includes('多大') || message.includes('size')) {
                return "可观测宇宙的直径约为930亿光年。但宇宙可能是无限的，或者远比我们能观测到的要大得多。";
            } else if (message.includes('起源') || message.includes('开始') || message.includes('origin') || message.includes('begin')) {
                return "根据大爆炸理论，宇宙起源于约138亿年前的一次奇点爆发，随后迅速膨胀并冷却，形成了我们今天看到的宇宙。";
            } else if (message.includes('黑洞') || message.includes('black hole')) {
                return "黑洞是时空中引力极强的区域，强到连光都无法逃脱。黑洞可以由大质量恒星死亡后坍缩形成，也有超大质量黑洞存在于大多数星系的中心。";
            } else if (message.includes('暗物质') || message.includes('dark matter')) {
                return "暗物质是一种假设存在的物质，它不发光也不吸收光，但通过引力与普通物质相互作用。科学家推测暗物质约占宇宙总质量-能量的27%。";
            } else if (message.includes('暗能量') || message.includes('dark energy')) {
                return "暗能量是一种假设存在的能量形式，被认为是导致宇宙加速膨胀的原因。暗能量约占宇宙总质量-能量的68%。";
            } else {
                return "宇宙是所有存在的时间、空间、物质和能量的总和。现代宇宙学认为宇宙起源于大爆炸，并且正在持续膨胀。";
            }
        }
        
        // 关于恒星的问题
        else if (message.includes('恒星') || message.includes('star')) {
            if (message.includes('寿命') || message.includes('life')) {
                return "恒星的寿命取决于其质量。太阳这样的恒星寿命约为100亿年，而质量更大的恒星寿命更短，可能只有几百万年；质量小的红矮星可能存活数万亿年。";
            } else if (message.includes('死亡') || message.includes('死掉') || message.includes('die')) {
                return "恒星死亡的方式取决于其质量。像太阳这样的恒星会膨胀为红巨星，然后抛出外层形成行星状星云，核心成为白矮星。质量更大的恒星会以超新星爆发结束生命，可能留下中子星或黑洞。";
            } else {
                return "恒星是由氢和氦等气体组成的巨大炽热天体，通过核聚变产生能量。宇宙中有数千亿个星系，每个星系中有数千亿颗恒星。";
            }
        }
        
        // 关于太阳的问题
        else if (message.includes('太阳') || message.includes('sun')) {
            if (message.includes('距离') || message.includes('distance')) {
                return "太阳距离地球平均约1.496亿公里，光从太阳到达地球需要约8分20秒。";
            } else if (message.includes('温度') || message.includes('temperature')) {
                return "太阳表面温度约为5,500°C，而其核心温度高达1,500万°C。";
            } else if (message.includes('寿命') || message.includes('life')) {
                return "太阳的总寿命预计约为100亿年，目前已经存在了约46亿年，还有约50亿年的寿命。";
            } else {
                return "太阳是太阳系的中心天体，一颗G型主序星。它的直径约为1,392,000公里，质量是地球的333,000倍，包含了太阳系99.86%的质量。";
            }
        }
        
        // 关于外星生命的问题
        else if (message.includes('外星') || message.includes('alien') || message.includes('生命') || message.includes('life')) {
            return "目前我们尚未发现地球以外的生命存在的确切证据。然而，考虑到宇宙的广阔和地球生命的多样性，科学家认为宇宙中很可能存在其他形式的生命。SETI项目和各种太空探测任务正在寻找外星生命的迹象。";
        }
        
        // 默认回复
        else {
            return "这是个有趣的问题！作为一个宇宙知识助手，我可以回答关于太阳系、行星、恒星、黑洞等宇宙天体的问题。你可以尝试问我关于特定行星的信息，或者宇宙的起源与结构等问题。";
        }
    }
}

// 更新观察者位置
function updateObserverPosition() {
    if (!planets['earth']) return;
    
    const earth = planets['earth'].mesh;
    const earthRadius = PLANET_DATA.earth.radius;
    
    // 将纬度和经度转换为弧度
    const latRad = THREE.MathUtils.degToRad(observerLatitude);
    const longRad = THREE.MathUtils.degToRad(observerLongitude);
    
    // 计算时间角度（一天的旋转）
    const hourAngle = (timeOfDay / 24) * Math.PI * 2;
    
    // 计算地球表面上的位置
    // x = r * cos(lat) * cos(long + hourAngle)
    // y = r * sin(lat)
    // z = r * cos(lat) * sin(long + hourAngle)
    const surfacePosition = new THREE.Vector3(
        Math.cos(latRad) * Math.cos(longRad + hourAngle) * (earthRadius + earthSurfaceViewOffset.x),
        Math.sin(latRad) * (earthRadius + earthSurfaceViewOffset.y),
        Math.cos(latRad) * Math.sin(longRad + hourAngle) * (earthRadius + earthSurfaceViewOffset.z)
    );
    
    // 将表面位置从地球局部坐标转换为世界坐标
    const worldSurfacePosition = surfacePosition.clone();
    earth.localToWorld(worldSurfacePosition);
    
    // 设置相机位置
    camera.position.copy(worldSurfacePosition);
    
    // 如果太阳存在，尝试将相机朝向太阳
    if (planets['sun'] && planets['sun'].mesh) {
        // 获取太阳位置
        const sunPosition = planets['sun'].mesh.position.clone();
        
        // 计算从观察者位置到太阳的方向
        const directionToSun = sunPosition.clone().sub(worldSurfacePosition).normalize();
        
        // 创建一个临时的目标点，在太阳方向上
        const target = worldSurfacePosition.clone().add(directionToSun.multiplyScalar(100));
        
        // 让相机看向太阳方向
        camera.lookAt(target);
        
        // 更新控制器目标
        controls.target.copy(target);
    } else {
        // 如果太阳不存在，使用默认的向外看方向
        // 计算向外看的方向（从地球中心指向表面位置的方向）
        const lookDirection = worldSurfacePosition.clone().sub(earth.position).normalize();
        
        // 计算一个向上的方向（垂直于视线方向）
        const up = new THREE.Vector3(0, 1, 0);
        
        // 创建一个临时的目标点，在视线方向上
        const target = worldSurfacePosition.clone().add(lookDirection.multiplyScalar(100));
        
        // 让相机看向这个方向
        camera.lookAt(target);
        
        // 更新控制器目标
        controls.target.copy(target);
    }
    
    // 隐藏地球的几何体，这样用户就看不到地球本身
    // 但保留地球的位置信息用于计算
    if (planets['earth'] && planets['earth'].mesh) {
        // 使地球透明，但保留其他行星可见
        planets['earth'].mesh.visible = false;
    }
}

// 更新画中画视图
function updatePipView() {
    // 更新画中画视图中的行星位置
    for (const [key, planet] of Object.entries(planets)) {
        if (key === 'sun' || key === 'moon' || !planet.pipMesh) continue;
        
        // 同步主场景中行星的位置到画中画视图
        planet.pipMesh.position.x = planet.mesh.position.x;
        planet.pipMesh.position.z = planet.mesh.position.z;
    }
    
    // 更新位置指示器
    updatePipIndicator();
    
    // 渲染画中画场景
    pipRenderer.render(pipScene, pipCamera);
}

// 更新太阳位置以模拟日出日落
function updateSunPosition() {
    if (!isEarthView || !planets['sun'] || !planets['earth']) return;
    
    // 获取地球位置
    const earthPosition = planets['earth'].mesh.position.clone();
    
    // 计算时间角度（一天的旋转）
    const hourAngle = (timeOfDay / 24) * Math.PI * 2;
    
    // 太阳距离（减小距离，使太阳在视野内可见）
    const sunDistance = 300; // 减小距离，确保太阳可见
    
    // 获取观察者在地球上的位置（纬度和经度）
    const latRad = THREE.MathUtils.degToRad(observerLatitude);
    const longRad = THREE.MathUtils.degToRad(observerLongitude);
    
    // 计算太阳相对于地球的位置
    // 计算太阳高度角（垂直角度）
    const localTime = (hourAngle / (Math.PI * 2) * 24 + 12) % 24; // 将角度转换为本地时间（0-24小时）
    const midday = 12; // 中午12点
    const hoursFromMidday = Math.abs(localTime - midday);
    const sunElevation = Math.PI/3 * (1 - hoursFromMidday / 12); // 调整最大高度为π/3
    
    // 计算太阳方位角（水平角度）
    // 早上太阳从东方升起，傍晚从西方落下
    const sunAzimuth = hourAngle;
    
    // 计算太阳的新位置，使用球坐标系
    const sunX = earthPosition.x + sunDistance * Math.cos(sunElevation) * Math.sin(sunAzimuth);
    const sunY = earthPosition.y + sunDistance * Math.sin(sunElevation);
    const sunZ = earthPosition.z + sunDistance * Math.cos(sunElevation) * Math.cos(sunAzimuth);
    
    // 更新太阳位置
    planets['sun'].mesh.position.set(sunX, sunY, sunZ);
    
    // 调整太阳大小，使其在远处看起来仍然足够大
    adjustSunSizeForEarthView(true);
    
    // 确保太阳在地球视角下是可见的
    if (planets['sun'] && planets['sun'].mesh) {
        planets['sun'].mesh.visible = true;
    }
    
    // 调试信息
    console.log(`时间: ${timeOfDay.toFixed(2)}时, 本地时间: ${localTime.toFixed(2)}时, 太阳高度角: ${(sunElevation * 180/Math.PI).toFixed(2)}°, 方位角: ${(sunAzimuth * 180/Math.PI).toFixed(2)}°`);
}

// 启动应用
window.onload = init; 