
export const FlowLayout = {
  placeLayoutElement(element, context) {
    const { 
      parentNode,
      closestTo: { node, isParent, placement }
    } = context;

    if (isParent) {
      if (placement === 'start') {
        parentNode.prepend(element);
      } else  {
        parentNode.append(element);
      }
    } else {
      if (placement === 'left' || placement === 'top') {
        parentNode.insertBefore(
          element, 
          node
        );
      } else {
        parentNode.insertBefore(
          element, 
          node.nextSibling
        );
      }
    }
  }
};