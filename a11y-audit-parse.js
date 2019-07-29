try {
  const a11yReport = require('./test-reports/lighthouse/a11y.report.json');
  const a11yScore = a11yReport.categories.accessibility.score;
  const a11yScoreFormatted = `${a11yScore ? a11yScore * 100 : 0}%`;

  console.log('*************************');
  console.log('a11y score: ', a11yScoreFormatted);
  console.log('*************************');

  if (a11yScore === 1) {
    // success!
    process.exit(0);
  } else {
    // fail build
    console.log(
      '\nNOTE: Lighthouse accessibility audit score must be 100% to pass this build step.\n\n',
    );
    process.exit(1);
  }
} catch (e) {
  console.error(e);
  process.exit(1);
}
