import component from './bn-BD/component';
import globalHeader from './bn-BD/globalHeader';
import menu from './bn-BD/menu';
import pages from './bn-BD/pages';
import pwa from './bn-BD/pwa';
import settingDrawer from './bn-BD/settingDrawer';
import settings from './bn-BD/settings';

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
