import { registerRoot, Composition } from 'remotion';
import { HookPlugDemo } from './compositions/HookPlugDemo';
import { ReplyFinderDemo } from './compositions/ReplyFinderDemo';
import { GitHubAutopilotDemo } from './compositions/GitHubAutopilotDemo';
import { BurntOutModeDemo } from './compositions/BurntOutModeDemo';
import { DashboardDemo } from './compositions/DashboardDemo';

const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="HookPlugDemo"
        component={HookPlugDemo}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{}}
      />
      <Composition
        id="ReplyFinderDemo"
        component={ReplyFinderDemo}
        durationInFrames={600}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{}}
      />
      <Composition
        id="GitHubAutopilotDemo"
        component={GitHubAutopilotDemo}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{}}
      />
      <Composition
        id="BurntOutModeDemo"
        component={BurntOutModeDemo}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{}}
      />
      <Composition
        id="DashboardDemo"
        component={DashboardDemo}
        durationInFrames={600}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{}}
      />
    </>
  );
};

registerRoot(RemotionRoot);