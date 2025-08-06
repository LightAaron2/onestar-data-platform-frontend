import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token }) => {
  return {
    // standardList: {
    //   '.ant-card-head': { borderBottom: 'none' },
    //   '.ant-card-head-title': { padding: '24px 0', lineHeight: '32px' },
    //   '.ant-card-extra': { padding: '24px 0' },
    //   '.ant-list-pagination': { marginTop: '24px', textAlign: 'right' },
    //   '.ant-avatar-lg': { width: '48px', height: '48px', lineHeight: '48px' },
    //   [`@media screen and (max-width: ${token.screenXS}px)`]: {
    //     '.ant-list-item-content': {
    //       display: 'block',
    //       flex: 'none',
    //       width: '100%',
    //     },
    //     '.ant-list-item-action': {
    //       marginLeft: '0',
    //     },
    //   },
    // },
    title: {
      marginBottom: '16px',
      color: token.colorTextHeading,
      fontWeight: '500',
      fontSize: '16px',
    },
    headerInfo: {
      position: 'relative',
      textAlign: 'center',
      '& > span': {
        display: 'inline-block',
        marginBottom: '4px',
        color: token.colorTextSecondary,
        fontSize: token.fontSize,
        lineHeight: '22px',
      },
      '& > p': {
        margin: '0',
        color: token.colorTextHeading,
        fontSize: '24px',
        lineHeight: '32px',
      },
      '& > em': {
        position: 'absolute',
        top: '0',
        right: '0',
        width: '1px',
        height: '56px',
        backgroundColor: token.colorSplit,
      },
      [`@media screen and (max-width: ${token.screenSM}px)`]: {
        marginBottom: '16px',
        '& > em': {
          display: 'none',
        },
      },
    }
  };
});

export default useStyles;
