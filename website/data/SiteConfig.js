// @flow
module.exports = {
  publicExamplesDir: 'examples/visible',
  privateExamplesDir: 'examples/hidden',
  blogPostDir: 'posts', // The name of directory that contains your posts.
  lessonsDir: 'lessons', // The name of the directory that contains lessons or docs.
  siteTitle: 'react beautiful dnd', // Site title.
  siteTitleAlt: 'Beautiful, accessible drag and drop for lists with React.js', // Alternative site title for SEO.
  siteLogo: '/logos/logo-1024.png', // Logo used for SEO and manifest.
  siteUrl: 'https://react-beautiful-dnd.netlify.com', // Domain of your website without pathPrefix.
  pathPrefix: '/', // Prefixes all links. For cases when deployed to example.github.io/gatsby-advanced-starter/.
  siteDescription: 'Beautiful, accessible drag and drop for lists with React.js', // Website description used for RSS feeds/meta description tag.
  siteRss: '/rss.xml', // Path to the RSS file.
  postDefaultCategoryID: 'Tech', // Default category for posts.
  userName: 'User', // Username to display in the author segment.
  userTwitter: 'alexandereardon', // Optionally renders "Follow Me" in the UserInfo segment.
  // userAvatar: 'https://api.adorable.io/avatars/150/test.png', // User avatar to display in the author segment.
  // Links to social profiles/projects you want to display in the author segment/navigation bar.
  userLinks: [
    {
      label: 'GitHub',
      url: 'https://github.com/alexreardon',
      iconClassName: 'fa fa-github',
    },
    {
      label: 'Twitter',
      url: 'https://twitter.com/alexandereardon',
      iconClassName: 'fa fa-twitter',
    },
    {
      label: 'Email',
      url: 'mailto:areardon@atlassian.com',
      iconClassName: 'fa fa-envelope',
    },
  ],
  copyright: 'Copyright © 2017. Advanced User', // Copyright string for the footer of the website and RSS feed.
  themeColor: '#c62828', // Used for setting manifest and progress theme colors.
  backgroundColor: '#e0e0e0', // Used for setting manifest background color.
  // TODO: Move this literally anywhere better.
  toCChapters: ['', 'Chapter 1', 'Chapter 2'], // Used to generate the Table Of Contents. Index 0 should be blank.
};
