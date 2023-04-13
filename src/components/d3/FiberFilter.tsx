import { useInsightTheme } from "@components/theme/InsightTheme"
import * as React from "react"
import * as HashSet from "@effect/data/HashSet"
import { Box, FormControlLabel,  Paper, Switch  } from "@mui/material"
import { FilterField } from "@components/filterfield /FilterField"
import * as FiberInfo from "@core/metrics/model/insight/fibers/FiberInfo"
import * as FiberId from "@core/metrics/model/insight/fibers/FiberId"

export interface FiberFilterParams { 
  activeOnly : boolean
  filterWords: string[]
  matchWords: boolean
  selected: HashSet.HashSet<number>
  pinned: HashSet.HashSet<number>
  traced: HashSet.HashSet<number>
}

export const matchFiber = (filter: FiberFilterParams) => (f: FiberInfo.FiberInfo) => { 
  const n = f.id.id

  const isActive = !(filter.activeOnly) || FiberInfo.isActive(f) 

  const inSelection = HashSet.has(filter.pinned, n) 
    || HashSet.has(filter.traced, n)
    || HashSet.has(filter.selected, n)
  
  const res = (isActive || inSelection) ? (() => {
    if (filter.matchWords) { 
      const loc = FiberId.formatLocation(f.id.location) 
      return filter.filterWords.reduce(
        (cur, w) => {return cur && loc.includes(w)}, true
      )
    } else { 
      return true
    }
  })() : inSelection

  //console.log(`${JSON.stringify(f.id)} -- ${JSON.stringify(filter)} -- ${FiberInfo.stateAsString(f)} -- ${isActive} -- ${inSelection} -- ${res}`)

  return res
}

export interface FiberFilterProps {
  filter: FiberFilterParams,
  onFilterChange?: (filter: FiberFilterParams) => void
}

export const FiberFilter : React.FC<FiberFilterProps> = (props) => {
  const theme = useInsightTheme()

  const filterChanged = (newFilter: FiberFilterParams) => 
    {
      console.log(JSON.stringify(newFilter))
      if (props.onFilterChange) props.onFilterChange(newFilter)
    }

  const toggleActiveOnly = () => {
    filterChanged({
      ...props.filter,
      activeOnly: !props.filter.activeOnly      
    })
  }

  const setFilterPhrase = (words: string[]) => {
    filterChanged({
      ...props.filter,
      filterWords: words
    })
  }

  return (
    <Box component={Paper} sx={{
      display: 'flex',
      flexDirection: 'row',
      padding: `${theme.padding.medium}px`
    }}>
      <FormControlLabel 
        label="Active only" 
        control={
          <Switch
            onChange={toggleActiveOnly} 
            checked={props.filter.activeOnly} 
           color="secondary"/>
        } 
        sx={{
        flexGrow: 0
        }}></FormControlLabel>
      <FilterField 
        onFilterChange={(words : string[]) => setFilterPhrase(words)} sx={{ 
          width: "100%"
        }}/>
    </Box>
  )
}