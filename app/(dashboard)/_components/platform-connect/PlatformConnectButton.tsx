import { PlatformType } from './platforms';
import { ConnectedAccount } from './platform-utils';
import { SocialPlatform } from '@/app/types/social-platforms';

interface PlatformConnectButtonProps {
  platform: PlatformType;
  account: ConnectedAccount | undefined;
  connecting: SocialPlatform | null;
  disconnecting: SocialPlatform | null;
  showInstagramOptions: boolean;
  setShowInstagramOptions: (show: boolean) => void;
  handleConnect: (platform: SocialPlatform, options?: { useFacebook?: boolean }) => void;
  handleDisconnect: (platform: SocialPlatform) => void;
}

export function PlatformConnectButton({
  platform,
  account,
  connecting,
  disconnecting,
  showInstagramOptions,
  setShowInstagramOptions,
  handleConnect,
  handleDisconnect,
}: PlatformConnectButtonProps) {
  const isLoading = connecting === platform.id || disconnecting === platform.id;

  if (account) {
    return (
      <button
        type="button"
        onClick={() => handleDisconnect(platform.id as SocialPlatform)}
        disabled={isLoading}
        className="w-full py-2 px-4 rounded-lg text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50"
        style={{ background: '#94A3B8' }}
      >
        {isLoading ? 'Disconnecting...' : 'Disconnect'}
      </button>
    );
  }

  if (platform.id === 'instagram' && !account) {
    return (
      <div className="space-y-2">
        {showInstagramOptions ? (
          <>
            <div className="space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
              {platform.connectionOptions?.map((option) => (
                <div key={option.id} className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{option.name}</h4>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleConnect(platform.id as SocialPlatform, {
                        useFacebook: option.id === 'facebook',
                      })}
                      className="px-3 py-1 text-sm rounded-md text-white"
                      style={{ background: platform.gradient }}
                    >
                      Select
                    </button>
                  </div>
                  <ul className="text-sm text-gray-600 list-disc list-inside pl-2">
                    {option.features.map((feature, i) => (
                      <li key={i}>{feature}</li>
                    ))}
                  </ul>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setShowInstagramOptions(false)}
                className="w-full py-2 px-4 rounded-lg text-gray-600 bg-gray-200 hover:bg-gray-300 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setShowInstagramOptions(true)}
            disabled={isLoading}
            className="w-full py-2 px-4 rounded-lg text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50"
            style={{ background: platform.gradient }}
          >
            {isLoading ? 'Connecting...' : 'Connect'}
          </button>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => handleConnect(platform.id as SocialPlatform)}
      disabled={isLoading}
      className="w-full py-2 px-4 rounded-lg text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50"
      style={{ background: platform.gradient }}
    >
      {isLoading ? 'Connecting...' : 'Connect'}
    </button>
  );
}
