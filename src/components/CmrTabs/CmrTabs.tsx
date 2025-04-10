import { useState, cloneElement, ReactElement, SyntheticEvent } from 'react';
import { Tabs, Tab, Typography, Box } from '@mui/material';
import type { TabInfo } from './tab.model';

interface CmrTabsProps {
  tabList: TabInfo[];
  onTabSelected?: (tabId: number) => void;
}

interface TabPanelProps {
  index: number;
  value: number;
  children: ReactElement;
}

function CustomTabPanel({ value, index, children }: TabPanelProps) {
  const isActive = value === index;

  return (
    <div
      role="tabpanel"
      hidden={!isActive}
      id={`cmr-tabpanel-${index}`}
      aria-labelledby={`cmr-tab-${index}`}
    >
      <Box sx={{ p: 0 }} style={{ display: isActive ? undefined : 'none' }}>
        <Typography component="div">{children}</Typography>
      </Box>
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `cmr-tab-${index}`,
    'aria-controls': `cmr-tabpanel-${index}`,
  };
}

export default function CmrTabs({ tabList, onTabSelected }: CmrTabsProps) {
  const [value, setValue] = useState(0);

  const handleChange = (_: SyntheticEvent, newValue: number) => {
    setValue(newValue);
    onTabSelected?.(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="cmr-tabs"
          textColor="inherit"
          TabIndicatorProps={{ style: { backgroundColor: '#580F8B' } }}
        >
          {tabList.map((tab, index) => (
            <Tab
              key={index}
              sx={{ color: value === index ? '#580F8B' : undefined }}
              style={{ fontSize: '14pt', textTransform: 'none' }}
              label={tab.text}
              {...a11yProps(index)}
            />
          ))}
        </Tabs>
      </Box>

      {tabList.map((tab, index) => (
        <CustomTabPanel key={index} value={value} index={index}>
          {cloneElement(tab.children, { visible: value === index })}
        </CustomTabPanel>
      ))}
    </Box>
  );
}
