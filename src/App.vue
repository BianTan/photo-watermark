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
import { ref, reactive, computed } from 'vue'
import { useChooseImage } from './hooks/useChooseImage'
import { convertQualityToBit, file2DataURL, url2Blob, url2Image } from './utils/2'
import * as canvasUtils from './utils/canvasUtils'

import { saveAs } from 'file-saver'
import getLogo from './assets/logo'
import exifr from 'exifr'
import dayjs from 'dayjs'

const containerRef = ref()
const cu = ref<canvasUtils.CanvasUtils | null>(null)
const file = ref<File | undefined>(undefined)
// 实例
const cuInstance = reactive<{
  leftText1: canvasUtils.Text | null;
  leftText2: canvasUtils.Text | null;
  rightText1: canvasUtils.Text | null;
  rightText2: canvasUtils.Text | null;
  logoImage: canvasUtils.Image | null;
}>({
  leftText1: null,
  leftText2: null,
  rightText1: null,
  rightText2: null,
  logoImage: null
})

const config = reactive({
  scale: 1,
  width: 0,
  height: 0,
  standardPadding: 130,
  fontWeight: 800,
  fontFamily: 'PingFangSC-Regular,PingFang,sans-serif'
})
const padding = computed(() => config.standardPadding * config.scale)
const H1 = computed(() => config.width * 0.03)
const H2 = computed(() => config.width * 0.02)
const SPACE = computed(() => config.width * 0.01)

const onUpload = async () => {
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
  const { width, height } = photo
  const { innerWidth } = window
  config.scale = Math.round(Math.min(innerWidth - 32, 648) / width * 100) / 100
  config.width = width * config.scale
  config.height = (height + (config.standardPadding * 2) + (width * 0.03) + (width * 0.02) + (width * 0.01)) * config.scale

  // 创建画布
  if (cu.value) cu.value = cu.value.dispose()
  cu.value = canvasUtils.init(containerRef.value, {
    width: config.width,
    height: config.height,
    bgColor: 'white',
    devicePixelRatio: 1 / config.scale
  })

  // 设置照片
  const image = new canvasUtils.Image({
    style: {
      image: photo,
      width: config.width,
      height: 'auto'
    }
  })
  cu.value.add(image)
  const exif = await exifr.parse(photo)
  console.log('exif: ', exif)
  console.log('image width', image.width)
  console.log('image height', image.height)

  const params = {
    fontWeight: config.fontWeight,
    fontFamily: config.fontFamily
  }
  // 左侧文字
  cuInstance.leftText1 = new canvasUtils.Text({
    style: {
      text: exif.Model ? exif.Model : '',
      size: H1.value,
      x: padding.value,
      y: image.height + padding.value,
      ...params
    }
  })
  cu.value.add(cuInstance.leftText1)
  cuInstance.leftText2 = new canvasUtils.Text({
    style: {
      text: exif.Model ? dayjs(exif.DateTimeOriginal).format('YYYY/MM/DD hh:mm') : '',
      color: '#625f5f',
      size: H2.value,
      x: padding.value,
      y: image.height + padding.value + H1.value + SPACE.value,
      ...params
    }
  })
  cu.value.add(cuInstance.leftText2)

  // 右侧文字
  const { FocalLengthIn35mmFormat, FNumber, ISO, ExposureTime } = exif
  const R1 = exif.ISO ? `${FocalLengthIn35mmFormat}MM F/${FNumber} ISO${ISO} 1/${1 / ExposureTime}S` : ''
  cuInstance.rightText1 = new canvasUtils.Text({
    style: {
      text: R1,
      textAlign: 'right',
      size: H1.value,
      x: config.width - padding.value,
      y: image.height + padding.value,
      ...params
    }
  })
  cu.value.add(cuInstance.rightText1)
  cuInstance.rightText2 = new canvasUtils.Text({
    style: {
      text: exif.LensModel ? exif.LensModel : '',
      color: '#625f5f',
      size: H2.value,
      x: config.width - padding.value - (cuInstance.rightText1.measureText?.width || 0),
      y: image.height + padding.value + H1.value + SPACE.value,
      ...params
    }
  })
  cu.value.add(cuInstance.rightText2)

  // 相机 Logo
  const logoDom = new Image()
  logoDom.src = await url2Blob(getLogo(exif.Make)) || ''
  logoDom.onload = () => {
    const logoHeight = H1.value + H2.value
    const logoWidth = (logoDom.naturalWidth * logoHeight / logoDom.naturalHeight)
    cuInstance.logoImage = new canvasUtils.Image({
      style: {
        image: logoDom,
        x: config.width - padding.value - (cuInstance.rightText1?.measureText?.width || 0) - (SPACE.value * 2) - logoWidth,
        y: image.height + padding.value + SPACE.value / 2,
        width: logoWidth,
        height: logoHeight
      }
    })
    cu.value.add(cuInstance.logoImage)
  }
}
const onDownload = () => {
  const canvas = cu.value?.canvas
  const ctx = cu.value?.ctx
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
