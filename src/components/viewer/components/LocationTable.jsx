import React from 'react';

import Box from '@mui/material/Box'

export default function LocationTable(props) {
  let display = 'none'
  if (props.isVisible){
    display = ''
  } else {
    display = 'none'
  }
  let data = props.tableData[0];
  let value = data?.power?(data?(data.value/data.transformA+data.transformB).toExponential(3):undefined)
      :(data?data.value.toFixed(props.decimalPrecision):undefined);
  return (
    <Box
      sx={{
        display: display === 'none'? 'none' : 'flex',
        height: '100%',
        width: (props.showDistribution)?'70%':'100%',
        alignSelf: 'flex-start',
        justifyContent: 'space-evenly'
      }}
      style={props.style}
    >
        <React.Fragment>
            <HintText>
                {`Value: ${value?value:undefined}`}
            </HintText>
            <HintText>
                {data?`Coordinates: (${data.mm[0].toFixed(props.decimalPrecision)}, ${data.mm[1].toFixed(props.decimalPrecision)}, ${data.mm[2].toFixed(props.decimalPrecision)})`
                    :`Coordinates: undefined`}
            </HintText>
            <HintText>
                {data?`Voxel location: (${data.vox[0]},${data.vox[1]},${data.vox[2]})`
                    :'Voxel location: undefined'}
            </HintText>
        </React.Fragment>

    </Box>
  );
}

const HintText = (props)=>{
    return <span style={{color: 'white', fontStyle: '12pt'}}>
        {props.children}
    </span>;
}
