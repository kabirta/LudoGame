import React, {
  memo,
  useMemo,
} from 'react';

import {View} from 'react-native';

import Cell from './Cell';

const VerticalPath = ({ cells, color }) => {
  // Grouping cells in batches of 3
  const groups = useMemo(() => {
    const grouped = [];
    for (let i = 0; i < cells.length; i += 3) {
      grouped.push(cells.slice(i, i + 3));
    }
    return grouped;
  }, [cells]);

  return (
    <View
      style={{
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        
      }}>
        <View style={{ flexDirection: 'column', width: '100%', height: '100%' }}>
            {groups.map((group, groupIndex) => (
                <View
                  key={`group-${groupIndex}`}
                  style={{
                    flexDirection: 'row',
                    width: '100%',
                    height: '16.7%',
                  }}>
                    {group.map((id, index) => (
                        <Cell 
                        key={`cell-${id}`} 
                        id={id}
                        color={color} />
                    ))}

                </View>
            ))}
        </View>
    </View>
  );
};

export default memo(VerticalPath);
