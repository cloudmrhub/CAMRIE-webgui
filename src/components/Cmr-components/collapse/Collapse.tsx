
import React, { cloneElement } from 'react';
import './Collapse.scss';

export interface CmrCollapseProps {
  accordion?: boolean;
  activeKey?: Array<string | number> | string | number;
  defaultActiveKey?: Array<string | number> | string | number;
  onChange?: (key: Array<string | number>) => void;
  children?: React.ReactNode;
}

interface CollapsibleChildProps {
  expanded?: boolean;
  panelKey?: string | number;
  header?: React.ReactNode;
}

const CmrCollapse: React.FC<CmrCollapseProps> = ({
  defaultActiveKey = [],
  activeKey,
  onChange,
  children,
}) => {
  const [activeKeys, setActiveKeys] = React.useState<Array<string | number>>(
    Array.isArray(defaultActiveKey) ? defaultActiveKey : [defaultActiveKey]
  );

  React.useEffect(() => {
    if (activeKey !== undefined) {
      setActiveKeys(Array.isArray(activeKey) ? activeKey : [activeKey]);
    }
  }, [activeKey]);

  const toggle = (key: string | number) => {
    const next = activeKeys.includes(key)
      ? activeKeys.filter(k => k !== key)
      : [...activeKeys, key];

    setActiveKeys(next);
    onChange?.(next);
  };

  const enhanced = React.Children.map(children, (child, index) => {
    if (!React.isValidElement(child)) return child;

    const key = child.key ?? index;
    const expanded = activeKeys.includes(key as string | number);

    return cloneElement(child as React.ReactElement<CollapsibleChildProps>, {
      expanded,
      panelKey: key,
      header: (
        <div onClick={() => toggle(key as string | number)} style={{ cursor: 'pointer' }}>
          {(child.props as CollapsibleChildProps).header}
        </div>
      ),
    });
  });

  return <div className="cmr-collapse">{enhanced}</div>;
};

export default CmrCollapse;