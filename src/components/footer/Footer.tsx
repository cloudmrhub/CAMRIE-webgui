import { Layout } from 'antd';
import './Footer.scss';

const { Footer } = Layout;

const FooterBar: React.FC = () => {
  const year = new Date().getFullYear();
  return (
    <Footer className="cmr-footer" style={{ textAlign: 'center', background: '#f8fafc' }}>
      &copy;&nbsp;{year} Center for Biomedical Imaging. All rights reserved.
    </Footer>
  );
};

export default FooterBar;
