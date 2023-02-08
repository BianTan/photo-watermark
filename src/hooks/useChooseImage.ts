
const input = document.createElement('input')
input.type = 'file'
let isClick = false

export function useChooseImage(accept = 'image/*'): Promise<File | undefined> {
  return new Promise((resolve) => {
    if (isClick) return undefined
    isClick = true
  
    input.accept = accept
    input.click()

    input.onchange = (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      isClick = false
      input.value = ''
      resolve(file)
    }
    input.oncancel = () => {
      isClick = false
    }
  })
}
