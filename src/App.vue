<template>
  <div class="home">
    <div ref="containerRef" class="canvas-container" />
    <div class="btn-group">
      <div class="upload btn" @click="onUpload">上传图片</div>
      <div class="download btn" @click="onDownload">下载图片</div>
    </div>
  </div>
</template>

<script lang='ts' setup>
import { ref, reactive } from 'vue'
import { convertQualityToBit, file2DataURL, url2Image } from './utils/2'
import * as canvasUtils from './utils/canvasUtils'
import { saveAs } from 'file-saver'

import { useCurDevice } from './hooks/useCurDevice'
import { useChooseImage } from './hooks/useChooseImage'
import { useWaterMark } from './hooks/useWaterMark'

let cu: canvasUtils.CanvasUtils | null = null
const { isIOS } = useCurDevice()
const containerRef = ref()
const file = ref<File | undefined>(undefined)
// 实例
const cuInstance = ref<{
  leftText1: canvasUtils.Text;
  leftText2: canvasUtils.Text;
  rightText1: canvasUtils.Text;
  rightText2: canvasUtils.Text;
  logo: canvasUtils.Image;
} | null>(null)

const config = reactive({
  scale: 1,
  width: 0,
  height: 0,
  standardPadding: 130,
  fontWeight: 800,
  fontFamily: 'PingFangSC-Regular,PingFang,sans-serif'
})

const onUpload = async () => {

  // 选择照片
  file.value = await useChooseImage()
  if (!file.value) return
  console.log('file: ', file)

  // file 照片转换为 base64
  const photoBase64 = await file2DataURL(file.value)
  if (!photoBase64) return
  // 转换为 Image 标签
  const photo = await url2Image(photoBase64)
  if (!photo) return

  // 获取、换算参数
  // 最大 canvas 分辨率有限制, 限制是针对面积
  // IOS9 以下最大允许 2096 2096 的 canvas，IOS9以上最大允许 4096 4096 (safari 也是)
  let { width, height } = photo
  if (isIOS.value) {
    if (width > height) {
      width = Math.min(photo.width, 4096)
      height = width * photo.height / photo.width
    } else {
      height = Math.min(photo.height, 4096)
      width = height * photo.width / photo.height
    }
  }

  const { innerWidth } = window
  config.scale = Math.round(Math.min(innerWidth - 32, 648) / width * 100) / 100
  config.width = width * config.scale
  config.height = (height + (config.standardPadding * 2) + (width * 0.03) + (width * 0.02) + (width * 0.01)) * config.scale

  // 创建画布
  if (cu) {
    cu = cu.dispose()
    cuInstance.value = null
  }
  cu = canvasUtils.init(containerRef.value, {
    width: config.width,
    height: config.height,
    bgColor: 'white',
    devicePixelRatio: 1 / config.scale
  })

  // 画上水印
  cuInstance.value = await useWaterMark(cu, {
    photo,
    config
  })
}

const onDownload = () => {
  const canvas = cu?.canvas
  const ctx = cu?.ctx
  if (!canvas || !ctx || !file.value) return

  const quality = 90
  if (['image/jpeg', 'image/jpg'].includes(file.value.type)) {
    canvas.toBlob(blob => {
      if (!blob) return
      saveAs(blob, file.value?.name)
    }, file.value.type, quality / 100)
  } else {
    const imageData = ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    ).data
    const bit = convertQualityToBit(quality)
    console.log('bit: ', bit)
    const png = (window as any).UPNG.encode([imageData.buffer], canvas.width, canvas.height, bit)
    saveAs(new File([png], file.value.name, {
      type: file.value.type,
    }), file.value.name)
  }
}

</script>

<style lang='scss'>
.home {
  .canvas-container {
    text-align: center;
    canvas {
      margin: 24px 0;
      box-shadow: 0px 4px 10px 1px #E5E5E5;
    }
  }
  .btn-group {
    display: flex;
    align-items: center;
    justify-content: center;
    column-gap: 12px;
    padding: 12px;
    .btn {
      padding: 4px 12px;
      color: white;
      font-size: 16px;
      background-color: coral;
      cursor: pointer;
    }
  }
}
</style>
