import { StandardTextFieldProps, TextField } from "@mui/material";
import * as React from "react"

export interface FilterFieldProps extends StandardTextFieldProps {
  onFilterChange?: (words: string[]) => void
}

export const FilterField : React.FC<FilterFieldProps> = (props) => {

  const [filterPhrase, setFilterPhrase] = React.useState<string>("")

  const updateFilter = (s: string) => {
    const words = s.split(/\s+/).filter((s) => s.trim().length > 0)
    setFilterPhrase(s)
    if (props.onFilterChange) props.onFilterChange(words)
  }

  return (
    <TextField
      {...props}
      value={filterPhrase}
      label={"Add a filter phrase"}
      onChange={(evt: React.ChangeEvent<HTMLInputElement>) => {
        updateFilter(evt.target.value)
      }}
    ></TextField>)

}