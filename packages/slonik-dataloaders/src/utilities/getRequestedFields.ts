import type {
  FragmentDefinitionNode,
  GraphQLResolveInfo,
  SelectionSetNode,
} from 'graphql';

const addFieldNamesFromSelectionSet = (
  fieldNames: Set<string>,
  selectionSet: SelectionSetNode,
  fragments: { [key: string]: FragmentDefinitionNode },
): void => {
  for (const selection of selectionSet.selections) {
    if (selection.kind === 'FragmentSpread') {
      addFieldNamesFromSelectionSet(
        fieldNames,
        fragments[selection.name.value].selectionSet,
        fragments,
      );
    } else if (selection.kind === 'InlineFragment') {
      addFieldNamesFromSelectionSet(
        fieldNames,
        selection.selectionSet,
        fragments,
      );
    } else {
      fieldNames.add(selection.name.value);
    }
  }
};

export const getRequestedFields = (
  info: Pick<GraphQLResolveInfo, 'fieldNodes' | 'fragments'>,
): Set<string> => {
  const fieldNames = new Set<string>();

  for (const fieldNode of info.fieldNodes) {
    if (fieldNode.selectionSet) {
      addFieldNamesFromSelectionSet(
        fieldNames,
        fieldNode.selectionSet,
        info.fragments,
      );
    }
  }

  return fieldNames;
};
