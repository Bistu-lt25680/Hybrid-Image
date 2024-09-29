let img1,img2,result;
const kernelSizeMax=100;
const alphaSliderMax=100;
const sigmaXSliderMax=15;
const sigmaYSliderMax=15;

function GetReady(){
    console.log('OpenCV.js is ready');

    document.getElementById('LoadImage1').addEventListener('click',()=>LoadImage('image1'));
    document.getElementById('LoadImage2').addEventListener('click',()=>LoadImage('image2'));
    document.getElementById('saveImage').addEventListener('click',SaveResult);
    if(document.getElementById('jumptoindex')){
        document.getElementById('ProcessImages').addEventListener('click',ProcessImagesByGaussianPyramid);
        document.getElementById('jumptoindex').addEventListener('click',()=>{
            window.location.href='index.html';
        });
    }
    if(document.getElementById('jumptopyramid')){
        document.getElementById('ProcessImages').addEventListener('click',ProcessImagesByGaussianBlur);
        document.getElementById('jumptopyramid').addEventListener('click',()=>{
            window.location.href='Gaussian-Pyramid.html';
        });
    }
    
    const sliders=['alphaSlider','kernel1Slider','kernel2Slider','sigmaXSlider','sigmaYSlider'];
    sliders.forEach(sliderId=>{
        const slider=document.getElementById(sliderId);
        if(slider){
            slider.addEventListener('input',UpdateSliderValue);
        }else{
            console.error(`滑动条${sliderId}未找到`);
        }
    });
}

function UpdateSliderValue(e){
    // 获取滑动条的值
    const valueElement=document.getElementById(`${e.target.id}Value`);
    if(valueElement){
        // 更新滑动条的值
        valueElement.textContent=e.target.value;
        if(document.getElementById('jumptoindex')){
            ProcessImagesByGaussianPyramid();
        }else{
            ProcessImagesByGaussianBlur();
        }
    }else{
        console.error(`未找到与滑动条 ${e.target.id} 对应的值显示元素，但继续处理图像`);
        if(document.getElementById('jumptoindex')){
            ProcessImagesByGaussianPyramid();
        }else{
            ProcessImagesByGaussianBlur();
        }
    }
}
function LoadImage(imageId){
    const input=document.createElement('input');
    input.type='file';
    input.accept='image/*';
    input.onchange=(e)=>{
        const file=e.target.files[0];
        const reader=new FileReader();
        reader.onload=(event)=>{
            document.getElementById(imageId).src=event.target.result;
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

function ProcessImagesByGaussianBlur(){
    // 检查opencv.js
    if(typeof cv==='undefined'){
        console.error('OpenCV.js is not loaded yet');
        return;
    }
    // 读取图片
    img1=cv.imread('image1');
    img2=cv.imread('image2');

    if(img1.empty()||img2.empty()){
        console.error('图像读取失败');
        return;
    }
    // 调整图片尺寸
    cv.resize(img2,img2,new cv.Size(img1.cols,img1.rows));

    let imgCatGaus=new cv.Mat();
    let imgDogGaus=new cv.Mat();
    let highFreq=new cv.Mat();
    let lowFreq=new cv.Mat();
    result=new cv.Mat();

    // 获取滑动条的值
    let alpha=parseInt(document.getElementById('alphaSlider').value)/alphaSliderMax;
    let kernel1=parseInt(document.getElementById('kernel1Slider').value);
    let kernel2=parseInt(document.getElementById('kernel2Slider').value);
    let sigmaX=parseInt(document.getElementById('sigmaXSlider').value);
    let sigmaY=parseInt(document.getElementById('sigmaYSlider').value);

    // 高斯滤波
    cv.GaussianBlur(img1,imgCatGaus,new cv.Size(kernel1,kernel1),sigmaX,sigmaY);
    cv.GaussianBlur(img2,imgDogGaus,new cv.Size(kernel2,kernel2),sigmaX,sigmaY);

    // 获取高频
    cv.subtract(img1,imgCatGaus,highFreq);

    // 归一化
    let normalized = new cv.Mat();
    cv.normalize(highFreq, normalized, 0, 255, cv.NORM_MINMAX, cv.CV_8U);

    // 增强对比度
    let highFreqEnhanced=new cv.Mat();
    cv.convertScaleAbs(normalized,highFreqEnhanced,2,128);

    //获取低频
    lowFreq=imgDogGaus;

    // 混合
    cv.addWeighted(highFreqEnhanced,alpha,lowFreq,1.0-alpha,0.0,result);

    // 打印图片
    cv.imshow('image1HighFreq',highFreqEnhanced);
    cv.imshow('image2LowFreq',lowFreq);
    cv.imshow('resultCanvas',result);

    // 释放内存
    img1.delete();
    img2.delete(); 
    imgCatGaus.delete(); 
    imgDogGaus.delete(); 
    highFreq.delete();
    normalized.delete();
    highFreqEnhanced.delete();
    lowFreq.delete();
}

function ProcessImagesByGaussianPyramid() {
    console.log('开始处理图像');
    // 检查opencv.js
    if (typeof cv === 'undefined') {
        console.error('OpenCV.js is not loaded yet');
        return;
    }
    // 读取图片
    let img1 = cv.imread('image1');
    let img2 = cv.imread('image2');

    if (img1.empty() || img2.empty()) {
        console.error('图像读取失败');
        return;
    }
    let alpha = parseInt(document.getElementById('alphaSlider').value) / alphaSliderMax;
    let kernel1 = parseInt(document.getElementById('kernel1Slider').value);
    let kernel2 = parseInt(document.getElementById('kernel2Slider').value);
    let sigmaX = parseFloat(document.getElementById('sigmaXSlider').value);
    let sigmaY = parseFloat(document.getElementById('sigmaYSlider').value);
    console.log(`参数: alpha=${alpha}, kernel1=${kernel1}, kernel2=${kernel2}, sigmaX=${sigmaX}, sigmaY=${sigmaY}`);
    
    // 调整图片尺寸
    cv.resize(img2, img2, new cv.Size(img1.cols, img1.rows));

    let img1Original = img1.clone();
    let img2Original = img2.clone();

    let temp1 = new cv.Mat();
    let temp2 = new cv.Mat();

    // 三次高斯模糊和缩小操作
    for (let i = 0; i < 3; i++) {
        cv.GaussianBlur(img1, img1, new cv.Size(kernel1, kernel1), sigmaX, sigmaY);
        cv.GaussianBlur(img2, img2, new cv.Size(kernel2, kernel2), sigmaX, sigmaY);

        // 缩小图像，保持宽高比
        let newSize1 = new cv.Size(Math.max(1, Math.floor(img1.cols / 2)), Math.max(1, Math.floor(img1.rows / 2)));
        let newSize2 = new cv.Size(Math.max(1, Math.floor(img2.cols / 2)), Math.max(1, Math.floor(img2.rows / 2)));
        cv.resize(img1, temp1, newSize1, 0, 0, cv.INTER_AREA);
        cv.resize(img2, temp2, newSize2, 0, 0, cv.INTER_AREA);

        // 将缩小后的图像赋值回原变量
        temp1.copyTo(img1);
        temp2.copyTo(img2);
    }


    // 放大三次
    for (let i = 0; i < 3; i++) {
        let newSize1 = new cv.Size(img1.cols * 2, img1.rows * 2);
        let newSize2 = new cv.Size(img2.cols * 2, img2.rows * 2);
        cv.resize(img1, img1, newSize1, 0, 0, cv.INTER_LINEAR);
        cv.resize(img2, img2, newSize2, 0, 0, cv.INTER_LINEAR);
    }


    // 确保所有图像尺寸相同
    cv.resize(img1, img1, new cv.Size(img1Original.cols, img1Original.rows));
    cv.resize(img2, img2, new cv.Size(img1Original.cols, img1Original.rows));

    // 计算高频部分
    let imgHighFreq = new cv.Mat();
    cv.subtract(img1Original, img1, imgHighFreq);

    // 归一化
    let normalized = new cv.Mat();
    cv.normalize(imgHighFreq, normalized, 0, 255, cv.NORM_MINMAX, cv.CV_8U);

    // 增强对比度
    let highFreqEnhanced=new cv.Mat();
    cv.convertScaleAbs(normalized,highFreqEnhanced,1,128);

    // 显示高频和低频部分
    cv.imshow('image1HighFreq', highFreqEnhanced);
    cv.imshow('image2LowFreq', img2);

    let result = new cv.Mat();
    cv.addWeighted(highFreqEnhanced, alpha, img2, 1.0 - alpha, 0.0, result);

    // 显示最终结果
    cv.imshow('resultCanvas', result);

    // 释放内存
    img1.delete();
    img2.delete();
    img1Original.delete();
    img2Original.delete();
    temp1.delete();
    temp2.delete();
    normalized.delete();
    highFreqEnhanced.delete();
    imgHighFreq.delete();
    result.delete();

}





function SaveResult(){
    const canvas=document.getElementById('resultCanvas');
    if(canvas){
        let link=document.createElement('a');
        link.download='result.png';
        link.href=canvas.toDataURL();
        link.click();
    }else{
        console.error('没有可保存的结果');
    }
}

(()=>{
    document.addEventListener('DOMContentLoaded',()=>{
        if(typeof cv!=='undefined'){
            GetReady();
        }else{
            console.error('OpenCV.js未能正确加载');
        }
    });
})();