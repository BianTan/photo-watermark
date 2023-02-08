import { computed } from 'vue'
import { url2Image } from '../utils/2'
import * as canvasUtils from '../utils/canvasUtils'
import exifr from 'exifr'
import dayjs from 'dayjs'
import getLogo from '../assets/logo'

interface IOpts {
  photo: HTMLImageElement;
  config: {
    scale: number,
    width: number,
    height: number,
    fontWeight: number | string,
    fontFamily: string;
    rem: number;
  }
}
export async function useWaterMark(cu: canvasUtils.CanvasUtils, {
  photo,
  config
}: IOpts) {
  // 配置
  const padding = computed(() => config.width * config.rem)
  const H1 = computed(() => config.width * 0.03)
  const H2 = computed(() => config.width * 0.02)
  const SPACE = computed(() => config.width * 0.01)

  // 设置照片
  const image = new canvasUtils.Image({
    style: {
      image: photo,
      width: config.width,
      height: 'auto'
    }
  })
  cu.add(image)
  const exif = await exifr.parse(photo)
  console.log('exif: ', exif)
  console.log('image width', image.width)
  console.log('image height', image.height)

  const params = {
    fontWeight: config.fontWeight,
    fontFamily: config.fontFamily
  }
  
  // 左侧文字
  const leftText1 = new canvasUtils.Text({
    style: {
      text: exif.Model ? exif.Model : '',
      size: H1.value,
      x: padding.value,
      y: image.height + padding.value,
      ...params
    }
  })
  cu.add(leftText1)
  const leftText2 = new canvasUtils.Text({
    style: {
      text: exif.Model ? dayjs(exif.DateTimeOriginal).format('YYYY/MM/DD HH:mm') : '',
      color: '#625f5f',
      size: H2.value,
      x: padding.value,
      y: image.height + padding.value + H1.value + SPACE.value,
      ...params
    }
  })
  cu.add(leftText2)

  // 右侧文字
  const { FocalLengthIn35mmFormat, FNumber, ISO, ExposureTime } = exif
  const R1 = exif.ISO ? `${FocalLengthIn35mmFormat}MM F/${FNumber} ISO${ISO} 1/${Math.round(1 / ExposureTime)}S` : ''
  const rightText1 = new canvasUtils.Text({
    style: {
      text: R1,
      textAlign: 'right',
      size: H1.value,
      x: config.width - padding.value,
      y: image.height + padding.value,
      ...params
    }
  })
  cu.add(rightText1)
  const rightText2 = new canvasUtils.Text({
    style: {
      text: exif.LensModel ? exif.LensModel.replace(`${exif.Model} `, '') : '',
      color: '#625f5f',
      size: H2.value,
      x: config.width - padding.value - (rightText1.measureText?.width || 0),
      y: image.height + padding.value + H1.value + SPACE.value,
      ...params
    }
  })
  cu.add(rightText2)

  // 相机 Logo
  const logoDom = await url2Image(getLogo(exif.Make))
  if (!logoDom) return null

  const logoHeight = H1.value + H2.value
  const logoWidth = (logoDom.naturalWidth * logoHeight / logoDom.naturalHeight)
  const logo = new canvasUtils.Image({
    style: {
      image: logoDom,
      x: config.width - padding.value - (rightText1?.measureText?.width || 0) - (SPACE.value * 2) - logoWidth,
      y: image.height + padding.value + SPACE.value / 2,
      width: logoWidth,
      height: logoHeight
    }
  })
  cu.add(logo)

  return {
    leftText1,
    leftText2,
    rightText1,
    rightText2,
    logo
  }
}
