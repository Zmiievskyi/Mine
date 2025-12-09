import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';

export interface GitHubProfile {
  githubId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  username?: string;
}

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(configService: ConfigService) {
    const clientID = configService.get<string>('github.clientId');
    const clientSecret = configService.get<string>('github.clientSecret');
    const callbackURL =
      configService.get<string>('github.callbackUrl') ||
      'http://localhost:3000/api/auth/github/callback';

    super({
      clientID: clientID || 'not-configured',
      clientSecret: clientSecret || 'not-configured',
      callbackURL,
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: Error | null, user?: GitHubProfile) => void,
  ): Promise<void> {
    const { id, emails, displayName, photos, username } = profile;

    const githubProfile: GitHubProfile = {
      githubId: id,
      email: emails?.[0]?.value || '',
      name: displayName || username || '',
      avatarUrl: photos?.[0]?.value,
      username: username,
    };

    done(null, githubProfile);
  }
}
