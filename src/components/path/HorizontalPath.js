import React, {useMemo} from 'react';

import {View} from 'react-native';

import Cell from './Cell'; // Make sure you import your Cell component

// Also ensure `cells` is passed as a prop

const HorizontalPath = React.memo(({ cells, color }) => {
  const groupedCells = useMemo(() => {
    const groups = [];
    for (let i = 0; i < cells.length; i += 6) {
      groups.push(cells.slice(i, i + 6));
    }
    return groups;
  }, [cells]);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        width: '40%',
        height: '100%',
      }}
    >
      <View style={{ flexDirection: 'column', width: '100%', height: '100%' }}>
        {groupedCells.map((group, groupIndex) => (
          <View
            key={groupIndex}
            style={{ flexDirection: 'row', width: '100%', height: '33.7%' }}
          >
            {group.map((id, cellIndex) => (
              <Cell
                key={`cell-${id}`}
                id={id}
                color={color}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
});

export default HorizontalPath;
