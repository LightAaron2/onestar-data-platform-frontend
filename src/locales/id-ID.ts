import component from './id-ID/component';
import globalHeader from './id-ID/globalHeader';
import menu from './id-ID/menu';
import pages from './id-ID/pages';
import pwa from './id-ID/pwa';
import settingDrawer from './id-ID/settingDrawer';
import settings from './id-ID/settings';

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
