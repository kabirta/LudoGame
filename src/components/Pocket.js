import React, {memo} from 'react';

import {
  StyleSheet,
  View,
} from 'react-native';
import {useDispatch} from 'react-redux';

import {Colors} from '../constants/Colors';

const Pocket = ({ color, player, data }) => {
  const dispatch = useDispatch();
  const handlePress = async value => {};

  return (
    <View style={[styles.container, { backgroundColor: color }]}>
      <View style={styles.childFrame}>
        <View style={styles.flexRow}>
          <Plot
            pieceNo={0}
            player={player}
            color={color}
            data={data}
            handlePress={handlePress}
          />
        </View>
      </View>
    </View>
  );
};

const Plot = ({ pieceNo, player, color, data, handlePress }) => {
  return (
    <View>
      <View style={[styles.container, { backgroundColor: color }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    width: '40%',
    height: '100%',
    borderColor: Colors.borderColor,
  },
  childFrame: {
    backgroundColor: 'white',
    borderWidth: 0.4,
    padding: 15,
    width: '70%',
    height: '70%',
    borderColor: Colors.borderColor,
  },
  flexRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    height: '40%',
    flexDirection:'row',
  },
  plot: {
    backgroundColor: Colors.green,
    height: '80%',
    width: '36%',
    borderRadius: 50,
  },
  plotContainer: {
    borderWidth: 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    borderColor: Colors.borderColor,
  },
});

export default memo(Pocket);
