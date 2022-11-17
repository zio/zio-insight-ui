
export const formatDate = (d: Date) => {
  const pad = (n: number, l: number) => `${n}`.padStart(l, "0")

  const tsDay = 
    `${pad(d.getFullYear(),4)}-${pad(d.getMonth(),2)}-${pad(d.getDate(),2)}`
  
    const tsMoment = 
      `${pad(d.getHours(), 2)}:${pad(d.getMinutes(), 2)}:${pad(d.getSeconds(), 2)}.${pad(d.getMilliseconds(), 3)}`

  return `${tsDay}-${tsMoment}`
}