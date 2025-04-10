import './Header.scss';
import { useAppSelector } from '../../../features/hooks';
import { AppDispatch } from '../../../features/store';
import { useDispatch } from 'react-redux';
import { signOut } from '../../../features/authenticate/authenticateActionCreation';
import Header from '../Cmr-components/header/Header';

const HeaderBar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const authentication = useAppSelector((state) => state.authenticate);

  const menuList = [
    { title: 'About', path: '/about' },
    { title: 'Bug Report', path: '/bug-report' },
  ];

  const handleLogout = () => {
    if (authentication?.accessToken) {
      dispatch(signOut(authentication.accessToken));
    }
  };

  return (
    <Header
      siteTitle="Camrie"
      authentication={authentication}
      menuList={menuList}
      handleLogout={handleLogout}
    />
  );
};

export default HeaderBar;
