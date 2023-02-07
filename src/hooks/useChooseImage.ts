
const input = document.createElement('input')
input.type = 'file'

export function useChooseImage(accept = 'image/*'): Promise<File | undefined> {
  return new Promise((resolve) => {
    let isClick = false
    if (isClick) return undefined
    isClick = true
  
    input.accept = accept
    input.click()

    input.onchange = (event: Event) => {
      const inputFile = event.target as HTMLInputElement
      isClick = false
      resolve(inputFile.files?.[0])
    }
    input.oncancel = () => {
      isClick = false
    }
  })
}
