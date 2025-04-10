import React from 'react';
import Box from '@mui/material/Box';

interface LocationTableProps {
  isVisible: boolean;
  tableData: {
    value: number;
    transformA?: number;
    transformB?: number;
    power?: boolean;
    mm: [number, number, number];
    vox: [number, number, number];
  }[];
  decimalPrecision: number;
  showDistribution?: boolean;
  style?: React.CSSProperties;
}

const LocationTable: React.FC<LocationTableProps> = ({
  isVisible,
  tableData,
  decimalPrecision,
  showDistribution = false,
  style
}) => {
  const data = tableData?.[0];

  const value = data
    ? data.power
      ? ((data.value / (data.transformA || 1)) + (data.transformB || 0)).toExponential(3)
      : data.value.toFixed(decimalPrecision)
    : undefined;

  return (
    <Box
      sx={{
        display: isVisible ? 'flex' : 'none',
        height: '100%',
        width: showDistribution ? '70%' : '100%',
        alignSelf: 'flex-start',
        justifyContent: 'space-evenly'
      }}
      style={style}
    >
      <HintText>{`Value: ${value ?? 'undefined'}`}</HintText>
      <HintText>
        {data
          ? `Coordinates: (${data.mm
              .map((v) => v.toFixed(decimalPrecision))
              .join(', ')})`
          : 'Coordinates: undefined'}
      </HintText>
      <HintText>
        {data
          ? `Voxel location: (${data.vox.join(', ')})`
          : 'Voxel location: undefined'}
      </HintText>
    </Box>
  );
};

const HintText: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ color: 'white', fontSize: '12pt' }}>{children}</span>
);

export default LocationTable;
