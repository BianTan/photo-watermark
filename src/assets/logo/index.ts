
import NikonLogo from './nikon.png'
import SonyLogo from './sony.png'
import FujifilmLogo from './fujifilm.png'
import AppleLogo from './apple.png'

const logo = {
    nikon: NikonLogo,
    sony: SonyLogo,
    fujifilm: FujifilmLogo,
    apple: AppleLogo,
}

export default function getLogo(make = ''){
  make = make.toLowerCase()
  if (make.includes('nikon')) {
    return logo.nikon
  } else if (make.includes('sony')) {
    return logo.sony
  } else if (make.includes('fujifilm')) {
    return logo.fujifilm
  } else if (make.includes('apple')) {
    return logo.apple
  } else {
    return ''
  }
}
