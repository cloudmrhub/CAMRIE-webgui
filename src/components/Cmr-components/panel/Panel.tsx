import { ReactNode } from 'react';
import ArrowDropUpIcon   from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import clsx from 'clsx';

interface CmrPanelProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onToggle'> {
  /** Controlled‑collapse props supplied by CmrCollapse */
  expanded?: boolean;
  panelKey?: string | number;
  onToggle?: (key: string | number | undefined) => void;

  /** UI */
  header?: string;
  children: ReactNode;
  cardProps?: React.HTMLAttributes<HTMLDivElement>;
}

const CmrPanel: React.FC<CmrPanelProps> = ({
  expanded = false,
  onToggle,
  panelKey,
  header,
  children,
  className,
  cardProps,
  ...rest
}) => {
  const toggle = () => onToggle?.(panelKey);

  return (
    <div className={clsx('card', className)} {...rest}>
      {/* header */}
      {header && (
        <div className="card-header bg-white">
          <div className="row align-items-center">
            <div className="col">{header}</div>

            {onToggle && (
              <div className="col text-end">
                <button
                  type="button"
                  className="btn p-0 react-collapse"
                  onClick={toggle}
                >
                  {expanded ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* body */}
      <div
        {...cardProps}
        className={clsx(
          'card-body',
          expanded ? 'm-5' : 'm-0',
          cardProps?.className
        )}
        style={{
          maxHeight: expanded ? undefined : 0,
          padding: 0,
          opacity: expanded ? 1 : 0,
          overflow: 'hidden',
          visibility: expanded ? 'visible' : 'collapse',
          transition: 'all 0.5s',
          ...cardProps?.style,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default CmrPanel;
