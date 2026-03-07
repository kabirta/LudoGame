import {BackHandler} from 'react-native';

const SUBSCRIPTIONS_KEY = '__codexBackHandlerSubscriptions';

const getSubscriptions = eventName => {
  if (!BackHandler[SUBSCRIPTIONS_KEY]) {
    BackHandler[SUBSCRIPTIONS_KEY] = new Map();
  }

  const subscriptions = BackHandler[SUBSCRIPTIONS_KEY];
  if (!subscriptions.has(eventName)) {
    subscriptions.set(eventName, new Map());
  }

  return subscriptions.get(eventName);
};

const installBackHandlerCompat = () => {
  if (
    typeof BackHandler?.addEventListener !== 'function' ||
    typeof BackHandler?.removeEventListener === 'function'
  ) {
    return;
  }

  const originalAddEventListener = BackHandler.addEventListener.bind(BackHandler);

  BackHandler.addEventListener = (eventName, handler) => {
    const eventSubscriptions = getSubscriptions(eventName);
    const subscription = originalAddEventListener(eventName, handler);
    const originalRemove = subscription?.remove?.bind(subscription);

    if (subscription && typeof originalRemove === 'function') {
      subscription.remove = () => {
        eventSubscriptions.delete(handler);
        originalRemove();
      };
    }

    eventSubscriptions.set(handler, subscription);
    return subscription;
  };

  BackHandler.removeEventListener = (eventName, handler) => {
    const subscription = getSubscriptions(eventName).get(handler);
    if (subscription?.remove) {
      subscription.remove();
    } else {
      getSubscriptions(eventName).delete(handler);
    }
  };
};

installBackHandlerCompat();
