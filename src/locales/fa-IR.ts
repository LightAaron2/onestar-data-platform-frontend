import component from './fa-IR/component';
import globalHeader from './fa-IR/globalHeader';
import menu from './fa-IR/menu';
import pages from './fa-IR/pages';
import pwa from './fa-IR/pwa';
import settingDrawer from './fa-IR/settingDrawer';
import settings from './fa-IR/settings';

export default {
  'navBar.lang': 'Languages',
  'layout.user.link.help': 'Help',
  'layout.user.link.privacy': 'Privacy',
  'layout.user.link.terms': 'Terms',
  'app.preview.down.block': 'Download this page to your local project',
  'app.welcome.link.fetch-blocks': 'Get all block',
  'app.welcome.link.block-list':
    'Quickly build standard, pages based on `block` development',
  ...globalHeader,
  ...menu,
  ...settingDrawer,
  ...settings,
  ...pwa,
  ...component,
  ...pages,
};
