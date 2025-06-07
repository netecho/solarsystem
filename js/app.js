// 太阳系3D模拟 - 主要JavaScript代码
// 使用Three.js创建一个交互式太阳系模拟

// 纹理加载器
const textureLoader = new THREE.TextureLoader();

// 添加纹理加载错误处理
textureLoader.crossOrigin = 'anonymous';

// 移动设备速度调整系数
const MOBILE_SPEED_FACTOR = 0.5; // 移动设备上速度减半

// 安全加载纹理的辅助函数
function loadTextureWithFallback(url, fallbackColor) {
    return new Promise((resolve) => {
        // 首先尝试加载原始URL
        textureLoader.load(
            url,
            // 成功加载时
            (texture) => {
                console.log(`纹理加载成功: ${url}`);
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                resolve(texture);
            },
            // 加载进度时
            undefined,
            // 加载失败时
            (err) => {
                console.warn(`纹理加载失败: ${url}`, err);
                
                // 尝试备用URL（如果是地球纹理）
                if (url.includes('earth')) {
                    const fallbackUrls = [
                        'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg',
                        'https://threejsfundamentals.org/threejs/resources/images/earth.jpg',
                        // 如果所有外部URL都失败，创建程序化纹理
                        null
                    ];
                    
                    tryFallbackUrls(fallbackUrls, fallbackColor, resolve);
                } else if (url.includes('moon')) {
                    const fallbackUrls = [
                        'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/moon_1024.jpg',
                        // 如果所有外部URL都失败，创建程序化纹理
                        null
                    ];
                    
                    tryFallbackUrls(fallbackUrls, fallbackColor, resolve);
                } else {
                    // 为其他纹理创建后备纹理
                    createFallbackTexture(fallbackColor, resolve);
                }
            }
        );
    });
}

// 尝试备用URL的辅助函数
function tryFallbackUrls(urls, fallbackColor, resolve, index = 0) {
    if (index >= urls.length || urls[index] === null) {
        // 所有URL都失败了，创建程序化纹理
        createFallbackTexture(fallbackColor, resolve);
        return;
    }
    
    textureLoader.load(
        urls[index],
        // 成功
        (texture) => {
            console.log(`备用纹理加载成功: ${urls[index]}`);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            resolve(texture);
        },
        // 进度
        undefined,
        // 失败，尝试下一个URL
        (err) => {
            console.warn(`备用纹理加载失败: ${urls[index]}`, err);
            tryFallbackUrls(urls, fallbackColor, resolve, index + 1);
        }
    );
}

// 创建后备纹理的辅助函数
function createFallbackTexture(fallbackColor, resolve) {
    console.log('创建程序化纹理作为后备');
    
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    
    // 为地球创建特殊的程序化纹理
    if (fallbackColor === 0x2727e6) {
        // 地球纹理：蓝色背景 + 绿色陆地
        context.fillStyle = '#2727e6'; // 蓝色海洋
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // 添加一些简单的大陆形状
        context.fillStyle = '#4a7c59'; // 绿色陆地
        
        // 绘制一些简单的大陆
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = 20 + Math.random() * 80;
            
            context.beginPath();
            context.arc(x, y, size, 0, Math.PI * 2);
            context.fill();
        }
        
        // 添加一些云层
        context.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = 30 + Math.random() * 60;
            
            context.beginPath();
            context.arc(x, y, size, 0, Math.PI * 2);
            context.fill();
        }
    } else {
        // 其他行星：使用纯色
        context.fillStyle = `#${fallbackColor.toString(16).padStart(6, '0')}`;
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // 添加一些噪点纹理
        for (let i = 0; i < 1000; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const brightness = Math.random() * 0.3 - 0.15;
            
            // 正确提取RGB分量
            const r = Math.floor(((fallbackColor >> 16) & 0xff) * (1 + brightness));
            const g = Math.floor(((fallbackColor >> 8) & 0xff) * (1 + brightness));
            const b = Math.floor((fallbackColor & 0xff) * (1 + brightness));
            
            // 确保颜色值在有效范围内
            const clampedR = Math.max(0, Math.min(255, r));
            const clampedG = Math.max(0, Math.min(255, g));
            const clampedB = Math.max(0, Math.min(255, b));
            
            context.fillStyle = `rgb(${clampedR}, ${clampedG}, ${clampedB})`;
            context.fillRect(x, y, 1, 1);
        }
    }
    
    const fallbackTexture = new THREE.CanvasTexture(canvas);
    fallbackTexture.wrapS = THREE.RepeatWrapping;
    fallbackTexture.wrapT = THREE.RepeatWrapping;
    resolve(fallbackTexture);
}

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
        texture: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/earth_atmos_2048.jpg',
        bumpMap: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/earth_normal_2048.jpg',
        specularMap: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/earth_specular_2048.jpg',
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
        texture: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/moon_1024.jpg',
        bumpMap: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/moon_bump_1024.jpg',
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
let starField; // 星空背景全局引用
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

// 添加全局变量来控制移动端状态
let isMobile = false;
let isFullscreen = false;

// 添加动画帧计数器
let animationFrame = 0;

// 初始化函数
function init() {
    console.log("初始化应用...");
    
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
    
    // 创建渲染器并确保移动端兼容性
    renderer = new THREE.WebGLRenderer({ 
        antialias: window.innerWidth > 768, // 仅在非移动设备上使用抗锯齿
        powerPreference: "high-performance",
        alpha: false
    });
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
    
    // 检测是否为移动设备 - 提前检测设备类型
    checkMobileDevice();
    
    console.log("创建星空背景...");
    // 添加星空背景 - 只创建一次
    starField = createStars();
    
    console.log("创建行星...");
    // 添加行星 - 只创建一次
    createPlanets();
    
    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);
    
    // 添加点光源（太阳光）
    const sunLight = new THREE.PointLight(0xffffff, 1.5, 300);
    scene.add(sunLight);
    
    // 初始化画中画视图（在行星创建之后）
    initPipView();
    
    // 初始化移动设备特定功能
    if(isMobile) {
        console.log("设置移动设备特定功能...");
        setupMobileControls();
        
        // 确保starField已经创建
        if (!starField) {
            console.log("警告: starField未定义，重新创建...");
            starField = createStars();
        }
        
        // 移动设备性能优化 - 使用延迟确保所有对象已创建
        setTimeout(() => {
            console.log("应用移动设备性能优化...");
            setupPerformanceOptimizations();
        }, 1000);
        
        // 添加额外的确认步骤来验证移动设备上的3D对象
        setTimeout(() => {
            console.log("验证移动设备渲染...");
            verifyMobileRendering();
        }, 2000);
        
        setupOrientationChangeHandler();
    }
    
    // 设置窗口大小调整监听
    window.addEventListener('resize', onWindowResize);
    
    // 添加鼠标点击事件
    window.addEventListener('click', onMouseClick, false);
    
    // 设置速度控制
    setupSpeedControls();
    
    // 设置视角控制
    setupViewControls();
    
    // 设置聊天功能
    setupChatFeature();
    
    // 启动动画循环
    animate();
    
    console.log("初始化完成");
}

// 检测设备类型
function checkMobileDevice() {
    // 检测移动设备
    isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // 根据设备类型添加类名到body
    if(isMobile) {
        document.body.classList.add('mobile-device');
        
        // 移动设备上减半速度
        adjustSpeedsForMobile();
        
        // 确保渲染器和场景已正确配置
        if (renderer) {
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
    } else {
        document.body.classList.remove('mobile-device');
        
        // 非移动设备恢复默认速度
        resetSpeedsToDefault();
        
        // 恢复默认渲染设置
        if (renderer) {
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }
    
    return isMobile;
}

// 为移动设备调整速度
function adjustSpeedsForMobile() {
    // 调整所有行星的自转和公转速度
    for (const planetKey in PLANET_DATA) {
        const planetData = PLANET_DATA[planetKey];
        
        // 如果没有保存原始速度，先保存
        if (!planetData.originalRotationSpeed) {
            planetData.originalRotationSpeed = planetData.rotationSpeed;
        }
        if (!planetData.originalOrbitalSpeed) {
            planetData.originalOrbitalSpeed = planetData.orbitalSpeed;
        }
        
        // 减半速度
        planetData.rotationSpeed = planetData.originalRotationSpeed * MOBILE_SPEED_FACTOR;
        planetData.orbitalSpeed = planetData.originalOrbitalSpeed * MOBILE_SPEED_FACTOR;
    }
    
    console.log("已为移动设备调整速度（减半）");
}

// 恢复默认速度
function resetSpeedsToDefault() {
    // 恢复所有行星的原始速度
    for (const planetKey in PLANET_DATA) {
        const planetData = PLANET_DATA[planetKey];
        
        // 如果有保存原始速度，恢复它
        if (planetData.originalRotationSpeed) {
            planetData.rotationSpeed = planetData.originalRotationSpeed;
        }
        if (planetData.originalOrbitalSpeed) {
            planetData.orbitalSpeed = planetData.originalOrbitalSpeed;
        }
    }
    
    // 更新UI控件以反映默认速度
    updateSpeedControlsToDefault();
    
    console.log("已恢复默认速度");
}

// 更新速度控制滑块到默认值
function updateSpeedControlsToDefault() {
    const rotationSpeedSlider = document.getElementById('rotation-speed');
    const orbitalSpeedSlider = document.getElementById('orbital-speed');
    const rotationSpeedValue = document.getElementById('rotation-speed-value');
    const orbitalSpeedValue = document.getElementById('orbital-speed-value');
    
    if (rotationSpeedSlider && orbitalSpeedSlider) {
        // 恢复默认值
        rotationSpeedSlider.value = 1.0;
        orbitalSpeedSlider.value = 1.0;
        
        if (rotationSpeedValue) {
            rotationSpeedValue.textContent = '1.0';
        }
        if (orbitalSpeedValue) {
            orbitalSpeedValue.textContent = '1.0';
        }
        
        // 更新全局速度乘数
        rotationSpeedMultiplier = 1.0;
        orbitalSpeedMultiplier = 1.0;
        
        console.log("速度控制已重置为默认值");
    }
}

// 设置移动设备特定控制
function setupMobileControls() {
    console.log("设置移动设备控制...");
    
    // 控制面板切换功能
    const toggleControlsBtn = document.getElementById('toggle-controls');
    const infoPanel = document.getElementById('info');
    
    toggleControlsBtn.addEventListener('click', function() {
        document.body.classList.toggle('controls-collapsed');
        
        // 更新按钮图标
        const icon = this.querySelector('i');
        if(document.body.classList.contains('controls-collapsed')) {
            icon.className = 'fa-solid fa-bars';
            toggleControlsBtn.innerHTML = '控制面板 <i class="fa-solid fa-bars"></i>';
        } else {
            icon.className = 'fa-solid fa-times';
            toggleControlsBtn.innerHTML = '关闭面板 <i class="fa-solid fa-times"></i>';
        }
    });
    
    // 全屏模式切换
    const fullscreenBtn = document.getElementById('mobile-fullscreen-toggle');
    
    fullscreenBtn.addEventListener('click', function() {
        toggleFullscreen();
    });
    
    // 设置Hammer.js处理触摸事件
    setupTouchControls();
    
    // 设置移动端简化控制按钮
    setupMobileSimpleControls();
    
    // 设置移动端底部聊天框
    setupMobileChatInterface();
    
    // 隐藏画中画视图
    hidePipViewOnMobile();
    
    // 更新速度控制滑块的值，反映减半的速度
    updateSpeedControlsForMobile();
}

// 更新移动设备上的速度控制滑块
function updateSpeedControlsForMobile() {
    const rotationSpeedSlider = document.getElementById('rotation-speed');
    const orbitalSpeedSlider = document.getElementById('orbital-speed');
    const rotationSpeedValue = document.getElementById('rotation-speed-value');
    const orbitalSpeedValue = document.getElementById('orbital-speed-value');
    
    if (rotationSpeedSlider && orbitalSpeedSlider) {
        // 获取当前值
        const currentRotationSpeed = parseFloat(rotationSpeedSlider.value);
        const currentOrbitalSpeed = parseFloat(orbitalSpeedSlider.value);
        
        // 设置为减半的值
        const newRotationSpeed = currentRotationSpeed * MOBILE_SPEED_FACTOR;
        const newOrbitalSpeed = currentOrbitalSpeed * MOBILE_SPEED_FACTOR;
        
        // 更新滑块和显示值
        rotationSpeedSlider.value = newRotationSpeed.toFixed(1);
        orbitalSpeedSlider.value = newOrbitalSpeed.toFixed(1);
        
        if (rotationSpeedValue) {
            rotationSpeedValue.textContent = newRotationSpeed.toFixed(1);
        }
        if (orbitalSpeedValue) {
            orbitalSpeedValue.textContent = newOrbitalSpeed.toFixed(1);
        }
        
        // 更新全局速度乘数
        rotationSpeedMultiplier = newRotationSpeed;
        orbitalSpeedMultiplier = newOrbitalSpeed;
        
        console.log(`移动设备速度控制已更新: 自转=${newRotationSpeed.toFixed(1)}, 公转=${newOrbitalSpeed.toFixed(1)}`);
    }
}

// 设置移动端简化控制按钮
function setupMobileSimpleControls() {
    // 重置视角按钮
    const mobileResetViewBtn = document.getElementById('mobile-reset-view');
    if (mobileResetViewBtn) {
        mobileResetViewBtn.addEventListener('click', function() {
            resetCameraControls();
        });
    }
    
    // 显示/隐藏轨道按钮
    const mobileToggleOrbitsBtn = document.getElementById('mobile-toggle-orbits');
    if (mobileToggleOrbitsBtn) {
        let orbitsVisible = false; // 初始状态为隐藏
        
        mobileToggleOrbitsBtn.addEventListener('click', function() {
            orbitsVisible = !orbitsVisible;
            updateOrbitsVisibility(orbitsVisible);
            
            // 更新按钮文本
            this.textContent = orbitsVisible ? "隐藏轨道" : "显示轨道";
        });
    }
    
    // 显示/隐藏标签按钮
    const mobileToggleLabelsBtn = document.getElementById('mobile-toggle-labels');
    if (mobileToggleLabelsBtn) {
        let labelsVisible = false; // 初始状态为隐藏
        
        mobileToggleLabelsBtn.addEventListener('click', function() {
            labelsVisible = !labelsVisible;
            togglePlanetLabels(labelsVisible);
            
            // 更新按钮文本
            this.textContent = labelsVisible ? "隐藏标签" : "显示标签";
        });
    }
    
    // 移动端重新加载地球纹理按钮
    const mobileReloadTextureBtn = document.getElementById('mobile-reload-texture');
    if (mobileReloadTextureBtn) {
        mobileReloadTextureBtn.addEventListener('click', function() {
            this.textContent = '正在加载...';
            this.disabled = true;
            
            reloadEarthTexture();
            
            // 3秒后恢复按钮状态
            setTimeout(() => {
                this.textContent = '重新加载地球纹理';
                this.disabled = false;
            }, 3000);
        });
    }
}

// 切换行星标签显示
function togglePlanetLabels(visible) {
    // 移除现有标签
    const existingLabels = document.querySelectorAll('.planet-label');
    existingLabels.forEach(label => {
        label.remove();
    });
    
    // 如果需要显示标签，则创建新标签
    if (visible) {
        for (const [key, planet] of Object.entries(planets)) {
            if (key === 'moon') continue; // 跳过月球
            
            if (planet && planet.mesh) {
                createPlanetLabel(key, planet.mesh, planet.data.name);
            }
        }
    }
}

// 创建行星标签
function createPlanetLabel(planetKey, planetMesh, planetName) {
    const label = document.createElement('div');
    label.className = 'planet-label';
    label.textContent = planetName;
    label.style.position = 'absolute';
    label.style.color = '#ffcc00';
    label.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    label.style.padding = '2px 5px';
    label.style.borderRadius = '3px';
    label.style.fontSize = '12px';
    label.style.pointerEvents = 'none';
    label.style.zIndex = '1000';
    
    document.body.appendChild(label);
    
    // 存储标签引用，以便在动画循环中更新位置
    if (!window.planetLabels) {
        window.planetLabels = {};
    }
    
    window.planetLabels[planetKey] = {
        element: label,
        mesh: planetMesh
    };
}

// 更新行星标签位置
function updatePlanetLabels() {
    if (!window.planetLabels) return;
    
    for (const [key, labelData] of Object.entries(window.planetLabels)) {
        const { element, mesh } = labelData;
        
        // 将3D位置转换为屏幕坐标
        const position = new THREE.Vector3();
        mesh.getWorldPosition(position);
        
        position.project(camera);
        
        const x = (position.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-position.y * 0.5 + 0.5) * window.innerHeight;
        
        // 更新标签位置
        element.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
        
        // 根据深度调整透明度
        const distance = camera.position.distanceTo(mesh.position);
        const opacity = Math.max(0.2, Math.min(1, 200 / distance));
        element.style.opacity = opacity;
        
        // 如果在屏幕后面，则隐藏
        if (position.z > 1) {
            element.style.display = 'none';
        } else {
            element.style.display = 'block';
        }
    }
}

// 隐藏移动设备上的画中画视图
function hidePipViewOnMobile() {
    const pipView = document.getElementById('pip-view');
    if (pipView) {
        pipView.style.display = 'none';
    }
    
    // 禁用PIP相关功能
    if (pipRenderer) {
        // 停止PIP渲染以节省性能
        pipRenderer.setAnimationLoop(null);
    }
}

// 全屏模式切换函数
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
        }
        isFullscreen = true;
        document.getElementById('mobile-fullscreen-toggle').innerHTML = '<i class="fa-solid fa-compress"></i>';
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        isFullscreen = false;
        document.getElementById('mobile-fullscreen-toggle').innerHTML = '<i class="fa-solid fa-expand"></i>';
    }
}

// 设置触摸控制
function setupTouchControls() {
    const container = document.getElementById('container');
    const hammer = new Hammer(container);

    // 在闭包中保存初始缩放和旋转值，避免污染全局作用域
    let initialScale = 1;
    let initialRotation = { x: 0, y: 0 };
    
    // 启用捏合手势识别
    hammer.get('pinch').set({ enable: true });
    hammer.get('rotate').set({ enable: true });
    
    // 处理捏合缩放
    hammer.on('pinchstart', function(e) {
        initialScale = camera.zoom;
    });
    
    hammer.on('pinch', function(e) {
        // 根据捏合缩放比例调整相机缩放
        let newZoom = initialScale * e.scale;
        newZoom = Math.max(0.5, Math.min(newZoom, 10)); // 限制缩放范围
        camera.zoom = newZoom;
        camera.updateProjectionMatrix();
    });
    
    // 处理旋转手势
    hammer.on('rotatestart', function(e) {
        initialRotation = {
            x: controls.getPolarAngle(),
            y: controls.getAzimuthalAngle()
        };
    });
    
    hammer.on('rotate', function(e) {
        // 根据旋转角度调整相机角度
        const rotationFactor = 0.01;
        const deltaRotation = e.rotation * rotationFactor;
        
        // 应用旋转
        controls.rotateLeft(deltaRotation);
        controls.update();
    });
    
    // 处理点击行星
    hammer.on('tap', function(event) {
        const x = (event.center.x / window.innerWidth) * 2 - 1;
        const y = -(event.center.y / window.innerHeight) * 2 + 1;
        
        const vector = new THREE.Vector3(x, y, 0.5);
        vector.unproject(camera);
        
        const raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
        // 仅与行星网格进行射线检测，避免其他对象干扰
        const planetMeshes = Object.values(planets).map(p => p.mesh);
        const intersects = raycaster.intersectObjects(planetMeshes, true);
        
        if (intersects.length > 0) {
            const object = intersects[0].object;
            
            // 查找行星
            for (const planetKey in planets) {
                const planetMesh = planets[planetKey].mesh;
                if (object === planetMesh || object.parent === planetMesh) {
                    updatePlanetInfo(planetKey);
                    break;
                }
            }
        }
    });
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
            this.textContent = '切换到初始视角';
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
            // 切换到初始视角
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

            // 确保星空重新可见并重新添加到场景（防止被意外移除）
            if (!starField) {
                starField = createStars();
            }
            if (scene.getObjectByName('starField') === undefined) {
                scene.add(starField);
            }
            starField.visible = true;


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
    
    // 重新加载地球纹理按钮
    const reloadTextureButton = document.getElementById('reload-earth-texture');
    if (reloadTextureButton) {
        reloadTextureButton.addEventListener('click', function() {
            this.textContent = '正在加载...';
            this.disabled = true;
            
            reloadEarthTexture();
            
            // 3秒后恢复按钮状态
            setTimeout(() => {
                this.textContent = '重新加载地球纹理';
                this.disabled = false;
            }, 3000);
        });
    }
    
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
    starField = new THREE.Points(starsGeometry, starsMaterial); // 使用全局变量
    starField.name = "starField"; // 添加名称以便标识
    scene.add(starField);
    
    console.log("星空背景已创建");
    return starField; // 返回创建的星空对象
}

// 创建行星
function createPlanets() {
    console.log("开始创建行星...");
    
    // 遍历行星数据创建每个行星
    for (const [key, data] of Object.entries(PLANET_DATA)) {
        // 跳过月球，因为它会作为地球的卫星创建
        if (key === 'moon') continue;
        
        console.log(`创建行星: ${key}`);
        
        // 创建行星几何体和材质
        const geometry = new THREE.SphereGeometry(data.radius, 32, 32);
        let material;
        
        if (key === 'sun') {
            // 太阳使用自发光材质
            material = new THREE.MeshBasicMaterial({ color: data.color });
        } else if (data.hasTexture) {
            // 使用纹理贴图的行星 - 使用安全加载方式
            try {
                // 先创建基本材质
                material = new THREE.MeshPhongMaterial({ 
                    color: data.color,
                    shininess: 5
                });
                
                console.log(`开始加载行星 ${key} 的纹理...`);
                
                // 异步加载纹理，添加时间戳防止缓存
                const textureUrl = data.texture + '?t=' + Date.now();
                loadTextureWithFallback(textureUrl, data.color).then(texture => {
                    material.map = texture;
                    material.needsUpdate = true;
                    console.log(`行星 ${key} 主纹理已成功应用`);
                });
                
                // 如果有凹凸贴图，添加它
                if (data.bumpMap) {
                    const bumpUrl = data.bumpMap + '?t=' + Date.now();
                    loadTextureWithFallback(bumpUrl, 0x888888).then(bumpTexture => {
                        material.normalMap = bumpTexture;
                        material.normalScale = new THREE.Vector2(0.05, 0.05);
                        material.needsUpdate = true;
                        console.log(`行星 ${key} 凹凸贴图已应用`);
                    });
                }
                
                // 如果有高光贴图，添加它
                if (data.specularMap) {
                    const specularUrl = data.specularMap + '?t=' + Date.now();
                    loadTextureWithFallback(specularUrl, 0x444444).then(specularTexture => {
                        material.specularMap = specularTexture;
                        material.needsUpdate = true;
                        console.log(`行星 ${key} 高光贴图已应用`);
                    });
                }
            } catch (error) {
                console.error(`加载行星 ${key} 纹理时出错:`, error);
                // 出错时使用基本材质
                material = new THREE.MeshStandardMaterial({ 
                    color: data.color,
                    roughness: 0.7,
                    metalness: 0.2
                });
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
        planet.name = key; // 添加名称以便识别
        
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
        
        console.log(`行星 ${key} 已添加到场景, 位置: ${planet.position.x}, ${planet.position.y}, ${planet.position.z}`);
        
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
    
    console.log("行星创建完成，当前行星对象:", planets);
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
    console.log("创建月球...");
    const moonData = PLANET_DATA.moon;
    const geometry = new THREE.SphereGeometry(moonData.radius, 32, 32);
    
    let material;
    if (moonData.hasTexture) {
        try {
            // 先创建基本材质
            material = new THREE.MeshPhongMaterial({ 
                color: moonData.color,
                shininess: 5
            });
            
            // 异步加载纹理
            loadTextureWithFallback(moonData.texture, moonData.color).then(texture => {
                material.map = texture;
                material.needsUpdate = true;
            });
            
            // 如果有凹凸贴图，添加它
            if (moonData.bumpMap) {
                loadTextureWithFallback(moonData.bumpMap, 0x888888).then(bumpTexture => {
                    material.normalMap = bumpTexture;
                    material.normalScale = new THREE.Vector2(0.05, 0.05);
                    material.needsUpdate = true;
                });
            }
        } catch (error) {
            console.error("加载月球纹理时出错:", error);
            // 出错时使用基本材质
            material = new THREE.MeshStandardMaterial({ 
                color: moonData.color,
                roughness: 0.7,
                metalness: 0.2
            });
        }
    } else {
        material = new THREE.MeshStandardMaterial({ 
            color: moonData.color,
            roughness: 0.7,
            metalness: 0.2
        });
    }
    
    const moon = new THREE.Mesh(geometry, material);
    moon.name = "moon"; // 添加名称以便识别
    
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
    
    console.log("月球已创建");
    
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

// 更新窗口调整函数，增加移动设备检测
function onWindowResize() {
    // 检查设备类型
    checkMobileDevice();
    
    // 如果设备类型发生变化，重新应用相应的设置
    if(isMobile && !document.body.classList.contains('mobile-device')) {
        setupMobileControls();
    }
    
    // 更新相机和渲染器
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // 更新画中画视图
    if(pipRenderer) {
        const pipSize = isMobile ? 120 : 200;
        pipRenderer.setSize(pipSize, pipSize);
    }
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
    
    // 更新画中画视图 - 仅在非移动设备上
    if (!isMobile) {
        updatePipView();
    }
    
    // 更新行星标签位置
    if (window.planetLabels) {
        updatePlanetLabels();
    }
    
    // 定期检查行星可见性
    if (animationFrame % 120 === 0) { // 每120帧检查一次
        ensurePlanetsVisible();
    }
    
    // 渲染场景
    renderer.render(scene, camera);
    
    // 记录动画帧
    animationFrame = (animationFrame + 1) || 0;
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
        // 确保行星mesh存在并可见
        if (!planet || !planet.mesh) continue;
        
        // 确保行星可见
        planet.mesh.visible = true;
        
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
    
    // 定期检查所有行星可见性（每60帧检查一次）
    if (animationFrame % 60 === 0) {
        ensurePlanetsVisible();
    }
}

// 添加确保行星可见的辅助函数
function ensurePlanetsVisible() {
    for (const [key, planet] of Object.entries(planets)) {
        if (planet && planet.mesh && !planet.mesh.visible) {
            console.log(`行星 ${key} 不可见，正在修复...`);
            planet.mesh.visible = true;
        }
    }
}

// 设置聊天功能
function setupChatFeature() {
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    const chatMessages = document.getElementById('chat-messages');
    
    // 添加欢迎消息
    addBotMessage("你好！我是DeepSeek-R1，你可以问我关于宇宙和太阳系的问题。");
    
    // 桌面端发送消息
    chatSend.addEventListener('click', function() {
        sendChatMessage();
    });
    
    // 按回车键发送消息
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });
    
    // 发送聊天消息
    function sendChatMessage() {
        const message = chatInput.value.trim();
        if (message) {
            // 添加用户消息
            addUserMessage(message);
            
            // 清空输入框
            chatInput.value = '';
            
            // 获取AI回复
            getAIResponse(message).then(response => {
                addBotMessage(response);
                
                // 如果在移动设备上，也添加到移动端聊天框
                if (isMobile) {
                    const mobileChatMessages = document.getElementById('mobile-chat-messages');
                    if (mobileChatMessages) {
                        const messageDiv = document.createElement('div');
                        messageDiv.className = 'chat-message bot-message';
                        messageDiv.innerHTML = `<strong>DeepSeek: </strong>${response}`;
                        mobileChatMessages.appendChild(messageDiv);
                        mobileChatMessages.scrollTop = mobileChatMessages.scrollHeight;
                    }
                }
            });
        }
    }
    
    // 添加用户消息
    function addUserMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message user-message';
        messageDiv.innerHTML = `<strong>你: </strong>${message}`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // 添加机器人消息
    function addBotMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message bot-message';
        messageDiv.innerHTML = `<strong>DeepSeek: </strong>${message}`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // 获取AI回复
    async function getAIResponse(message) {
        // 这里可以接入实际的AI接口
        // 目前使用模拟回复
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(generateResponse(message));
            }, 1000);
        });
    }
    
    // 生成模拟回复
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

// 设置移动端底部聊天框
function setupMobileChatInterface() {
    const mobileChatContainer = document.getElementById('mobile-chat-container');
    const mobileChatToggle = document.getElementById('mobile-chat-toggle');
    const mobileChatInput = document.getElementById('mobile-chat-input');
    const mobileChatSend = document.getElementById('mobile-chat-send');
    const mobileChatMessages = document.getElementById('mobile-chat-messages');
    
    if (!mobileChatContainer) return;
    
    // 添加欢迎消息
    addMobileChatMessage("你好！我是DeepSeek-R1，你可以问我关于宇宙和太阳系的问题。", 'bot');
    
    // 切换聊天框展开/收起状态
    mobileChatToggle.addEventListener('click', function() {
        mobileChatContainer.classList.toggle('collapsed');
        
        // 更新按钮图标
        const icon = this.querySelector('i');
        if (mobileChatContainer.classList.contains('collapsed')) {
            icon.className = 'fa-solid fa-chevron-up';
        } else {
            icon.className = 'fa-solid fa-chevron-down';
            // 聊天框展开时，聚焦输入框
            mobileChatInput.focus();
        }
    });
    
    // 发送消息
    mobileChatSend.addEventListener('click', function() {
        sendMobileChatMessage();
    });
    
    // 按回车键发送消息
    mobileChatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMobileChatMessage();
        }
    });
    
    // 发送移动端聊天消息
    function sendMobileChatMessage() {
        const message = mobileChatInput.value.trim();
        if (message) {
            // 添加用户消息
            addMobileChatMessage(message, 'user');
            
            // 清空输入框
            mobileChatInput.value = '';
            
            // 获取AI回复
            getAIResponse(message).then(response => {
                addMobileChatMessage(response, 'bot');
            });
        }
    }
    
    // 添加消息到移动端聊天框
    function addMobileChatMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}-message`;
        
        // 添加发送者标识
        const sender = type === 'user' ? '你: ' : 'DeepSeek: ';
        messageDiv.innerHTML = `<strong>${sender}</strong>${message}`;
        
        // 添加到聊天框
        mobileChatMessages.appendChild(messageDiv);
        
        // 滚动到底部
        mobileChatMessages.scrollTop = mobileChatMessages.scrollHeight;
        
        // 如果聊天框是收起状态，展开它
        if (mobileChatContainer.classList.contains('collapsed')) {
            mobileChatToggle.click();
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

// 为移动设备添加性能优化
function setupPerformanceOptimizations() {
    if (isMobile) {
        console.log("应用移动设备性能优化");
        
        // 降低渲染质量但保持基本功能
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        
        // 仅隐藏轨道，不隐藏行星
        scene.children.forEach(child => {
            // 只处理轨道对象，确保行星可见
            if (child.name && child.name.includes('orbit')) {
                child.visible = false; // 只隐藏轨道来提高性能
            }
        });
        
        // 查找星空对象（如果全局变量未定义）
        if (!starField) {
            console.log("全局starField未定义，尝试在场景中查找...");
            scene.children.forEach(child => {
                if (child.name === "starField") {
                    starField = child;
                    console.log("在场景中找到starField");
                }
            });
            
            // 如果仍未找到，创建一个新的
            if (!starField) {
                console.log("未找到starField，创建新的星空背景");
                starField = createStars();
            }
        }
        
        // 减少恒星数量但不完全移除
        if (starField && starField.geometry && starField.geometry.attributes.position) {
            const positions = starField.geometry.attributes.position.array;
            const count = starField.geometry.attributes.position.count;
            
            // 只减少1/8的星星而不是之前的一半
            for (let i = 0; i < count; i += 8) {
                const idx = i * 3;
                // 将部分星星移到较远距离而不是完全移除
                positions[idx] *= 5;
                positions[idx + 1] *= 5;
                positions[idx + 2] *= 5;
            }
            
            starField.geometry.attributes.position.needsUpdate = true;
            starField.visible = true; // 确保星空可见
        } else {
            console.log("无法优化星空：starField对象不完整", starField);
        }
        
        // 输出所有行星信息用于调试
        console.log("行星对象结构:", planets);
        
        // 确保太阳和所有行星都是可见的
        for (const planetKey in planets) {
            const planet = planets[planetKey];
            console.log(`检查行星 ${planetKey}:`, planet);
            
            if (planet && planet.mesh) {
                planet.mesh.visible = true;
                console.log(`确保行星可见: ${planetKey}`);
            } else if (planet && planet.hasOwnProperty('children')) {
                // 如果是分组对象，遍历其子对象
                planet.children.forEach(child => {
                    child.visible = true;
                });
                console.log(`确保行星组可见: ${planetKey}`);
            } else {
                console.log(`行星结构不正确: ${planetKey}`, planet);
            }
        }
        
        // 特别确保太阳可见
        if (planets['sun']) {
            if (planets['sun'].mesh) {
                planets['sun'].mesh.visible = true;
                console.log("确保太阳可见 (mesh)");
            } else {
                console.log("太阳对象结构:", planets['sun']);
            }
        } else {
            console.log("太阳对象不存在");
        }
        
        // 检查场景中所有对象
        console.log("场景中所有对象:");
        scene.children.forEach((child, index) => {
            console.log(`对象 ${index}:`, child.name || "未命名", child.visible);
        });
    }
}

// 添加屏幕方向变化监听
function setupOrientationChangeHandler() {
    window.addEventListener('orientationchange', function() {
        // 延迟一小段时间以确保尺寸已经改变
        setTimeout(() => {
            onWindowResize();
            
            // 根据屏幕方向进行额外调整
            if (window.orientation === 90 || window.orientation === -90) {
                // 横屏模式
                document.body.classList.add('landscape');
                document.body.classList.remove('portrait');
            } else {
                // 竖屏模式
                document.body.classList.add('portrait');
                document.body.classList.remove('landscape');
            }
        }, 300);
    });
    
    // 初始检查
    if (window.orientation === 90 || window.orientation === -90) {
        document.body.classList.add('landscape');
    } else {
        document.body.classList.add('portrait');
    }
}

// 添加验证移动设备渲染的函数
function verifyMobileRendering() {
    console.log("验证移动设备渲染...");
    
    // 验证场景中是否有对象
    if (scene.children.length === 0) {
        console.error("场景中没有对象!");
        // 尝试重新创建
        createStars();
        createPlanets();
        return;
    }
    
    // 验证行星是否存在和可见
    let planetCount = 0;
    let visiblePlanetCount = 0;
    
    for (const planetKey in planets) {
        planetCount++;
        if (planets[planetKey] && planets[planetKey].mesh) {
            if (planets[planetKey].mesh.visible) {
                visiblePlanetCount++;
            } else {
                console.log(`行星 ${planetKey} 不可见，正在修复...`);
                planets[planetKey].mesh.visible = true;
            }
        } else {
            console.error(`行星 ${planetKey} 未正确初始化`);
        }
    }
    
    console.log(`场景中有 ${scene.children.length} 个对象，${planetCount} 个行星，${visiblePlanetCount} 个可见行星`);
    
    // 验证渲染器和相机
    if (!renderer || !camera) {
        console.error("渲染器或相机未初始化!");
        return;
    }
    
    // 确保渲染器尺寸正确
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // 确保相机参数正确
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    // 强制立即渲染
    renderer.render(scene, camera);
    
    console.log("移动设备渲染验证完成");
}

// 启动应用
window.onload = init;

// 手动重新加载地球纹理
function reloadEarthTexture() {
    console.log("手动重新加载地球纹理...");
    
    if (!planets['earth'] || !planets['earth'].mesh) {
        console.error("地球对象不存在");
        return;
    }
    
    const earth = planets['earth'].mesh;
    const earthData = PLANET_DATA.earth;
    
    // 保存旧材质的引用以便后续处理
    const oldMaterial = earth.material;
    
    // 创建新的材质
    const newMaterial = new THREE.MeshPhongMaterial({ 
        color: earthData.color,
        shininess: 5
    });
    
    // 重新加载主纹理
    const textureUrl = earthData.texture + '?reload=' + Date.now();
    loadTextureWithFallback(textureUrl, earthData.color).then(texture => {
        newMaterial.map = texture;
        newMaterial.needsUpdate = true;
        
        // 替换材质并处理旧材质
        earth.material = newMaterial;
        
        // 正确释放旧材质资源
        if (oldMaterial) {
            // 释放旧材质的纹理
            if (oldMaterial.map) oldMaterial.map.dispose();
            if (oldMaterial.normalMap) oldMaterial.normalMap.dispose();
            if (oldMaterial.specularMap) oldMaterial.specularMap.dispose();
            // 释放材质本身
            oldMaterial.dispose();
        }
        
        console.log("地球主纹理重新加载成功");
    });
    
    // 重新加载凹凸贴图
    if (earthData.bumpMap) {
        const bumpUrl = earthData.bumpMap + '?reload=' + Date.now();
        loadTextureWithFallback(bumpUrl, 0x888888).then(bumpTexture => {
            newMaterial.normalMap = bumpTexture;
            newMaterial.normalScale = new THREE.Vector2(0.05, 0.05);
            newMaterial.needsUpdate = true;
            console.log("地球凹凸贴图重新加载成功");
        });
    }
    
    // 重新加载高光贴图
    if (earthData.specularMap) {
        const specularUrl = earthData.specularMap + '?reload=' + Date.now();
        loadTextureWithFallback(specularUrl, 0x444444).then(specularTexture => {
            newMaterial.specularMap = specularTexture;
            newMaterial.needsUpdate = true;
            console.log("地球高光贴图重新加载成功");
        });
    }
}
