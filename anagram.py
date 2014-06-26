#!/usr/bin/python

import argparse
import random
import sys

# http://stackoverflow.com/questions/55210/algorithm-to-generate-anagrams
# Modified to take only one input at a time from the command-line instead of interactively

MIN_WORD_SIZE = 4 # min size of a word in the output

class Node(object):
    def __init__(self, letter='', final=False, depth=0):
        self.letter = letter
        self.final = final
        self.depth = depth
        self.children = {}
    def add(self, letters):
        node = self
        for index, letter in enumerate(letters):
            if letter not in node.children:
                node.children[letter] = Node(letter, index==len(letters)-1, index+1)
            node = node.children[letter]
    def anagram(self, letters):
        tiles = {}
        for letter in letters:
            tiles[letter] = tiles.get(letter, 0) + 1
        min_length = len(letters)
        return self._anagram(tiles, [], self, min_length)
    def _anagram(self, tiles, path, root, min_length):
        if self.final and self.depth >= MIN_WORD_SIZE:
            word = ''.join(path)
            length = len(word.replace(' ', ''))
            if length >= min_length:
                yield word
            path.append(' ')
            for word in root._anagram(tiles, path, root, min_length):
                yield word
            path.pop()
        for letter, node in self.children.iteritems():
            count = tiles.get(letter, 0)
            if count == 0:
                continue
            tiles[letter] = count - 1
            path.append(letter)
            for word in node._anagram(tiles, path, root, min_length):
                yield word
            path.pop()
            tiles[letter] = count

def load_dictionary(path):
    result = Node()
    for line in open(path, 'r'):
        word = line.strip().lower()
        result.add(word)
    return result

def main():
    parser = argparse.ArgumentParser(description='Get letters to make an anagram of')
    parser.add_argument('letters')
    letters = parser.parse_args().letters.lower().replace(' ', '')

    words = load_dictionary('words.txt')

    anagrams = []
    for word in words.anagram(letters):
        anagrams.append(word)

    if len(anagrams) > 0:
       sys.stdout.write(random.choice(anagrams))
       sys.exit()
    else:
       sys.stderr.write('__ERROR__')
       sys.exit(1)

if __name__ == '__main__':
    main()
