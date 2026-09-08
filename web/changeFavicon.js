// 缓存常用变量
const isEdgeExtension = !window.location.protocol.includes('http') && window.navigator.userAgent.includes('Edg');
const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
let currentIconHref = null; // 用于缓存当前图标的 href

// 动态设置图标的函数
function setIcon() {
    // 获取或创建 favicon 元素
    let applyIcon = document.head.querySelector('link[rel="icon"]');
    if (!applyIcon) {
        applyIcon = document.createElement('link');
        applyIcon.rel = 'icon';
        document.head.appendChild(applyIcon);
    }

    // 根据条件选择图标路径和对应的 MIME 类型
    let newIconHref, iconType;
    if (isEdgeExtension) {
        newIconHref = '/icons/logoBlack.svg';
        iconType = 'image/svg+xml'; // SVG 的 MIME 类型
    } else if (colorSchemeQuery.matches) {
        newIconHref = '/icons/logoWhite.svg';
        iconType = 'image/svg+xml'; // SVG 的 MIME 类型
    } else {
        newIconHref = '/icons/logo.png';
        iconType = 'image/png'; // PNG 的 MIME 类型
    }

    // 只有在图标路径或类型发生变化时才更新 DOM
    if (newIconHref !== currentIconHref || applyIcon.type !== iconType) {
        applyIcon.href = newIconHref;
        applyIcon.type = iconType; // 设置正确的 MIME 类型
        currentIconHref = newIconHref; // 更新缓存
    }
}

// 页面加载时设置初始图标
setIcon();

// 监听主题变化事件
function onColorSchemeChange() {
    setIcon();
}

// 使用现代和旧版浏览器的兼容性处理
if (typeof colorSchemeQuery.addEventListener === 'function') {
    colorSchemeQuery.addEventListener('change', onColorSchemeChange);
} else if (typeof colorSchemeQuery.addListener === 'function') {
    colorSchemeQuery.addListener(onColorSchemeChange);
}